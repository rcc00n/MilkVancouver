from rest_framework import serializers

from products.models import Product
from .models import Order, OrderItem, Region


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class RegionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Region
        fields = ["code", "name", "delivery_weekday", "min_orders"]


class AddressSerializer(serializers.Serializer):
    line1 = serializers.CharField(required=False, allow_blank=True)
    line2 = serializers.CharField(required=False, allow_blank=True)
    city = serializers.CharField(required=False, allow_blank=True)
    postal_code = serializers.CharField(required=False, allow_blank=True)
    notes = serializers.CharField(required=False, allow_blank=True)


class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.IntegerField(source="product.id", read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "product_id",
            "product_name",
            "quantity",
            "unit_price_cents",
            "total_cents",
            "image_url",
        ]
        read_only_fields = fields

    def get_image_url(self, obj):
        product = getattr(obj, "product", None)
        if not product:
            return ""
        if product.image:
            try:
                return product.image.url
            except Exception:
                return ""
        return product.main_image_url or ""


class OrderCreateSerializer(serializers.ModelSerializer):
    items = OrderItemInputSerializer(many=True)
    address = AddressSerializer(required=False)
    notes = serializers.CharField(required=False, allow_blank=True)
    delivery_notes = serializers.CharField(required=False, allow_blank=True)
    region_code = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Order
        fields = [
            "id",
            "full_name",
            "email",
            "phone",
            "order_type",
            "status",
            "items",
            "address",
            "notes",
            "delivery_notes",
            "region_code",
        ]
        read_only_fields = ["id", "status"]

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("At least one item is required.")

        product_ids = [item["product_id"] for item in items]
        products = Product.objects.filter(id__in=product_ids)
        if products.count() != len(set(product_ids)):
            raise serializers.ValidationError("One or more products are unavailable.")
        return items

    def validate(self, attrs):
        order_type = attrs.get("order_type")
        address = attrs.get("address", {})
        required_delivery_fields = ["line1", "city", "postal_code"]

        # Only delivery is supported.
        if order_type != Order.OrderType.DELIVERY:
            raise serializers.ValidationError("Only delivery orders are supported.")

        missing = [f for f in required_delivery_fields if not address.get(f)]
        if missing:
            missing_fields = ", ".join(missing)
            raise serializers.ValidationError(f"Delivery requires: {missing_fields}.")

        return attrs

    def create(self, validated_data):
        items_data = validated_data.pop("items")
        address_data = validated_data.pop("address", {})
        delivery_notes = validated_data.pop("delivery_notes", "")
        region_code = validated_data.pop("region_code", "").strip()

        product_ids = [item["product_id"] for item in items_data]
        products = Product.objects.filter(id__in=product_ids)
        product_map = {product.id: product for product in products}

        subtotal = 0
        for item in items_data:
            product = product_map[item["product_id"]]
            subtotal += product.price_cents * item["quantity"]

        tax_cents = 0
        total_cents = subtotal + tax_cents

        region = Region.objects.filter(code=region_code).first() if region_code else None

        order = Order.objects.create(
            address_line1=address_data.get("line1", ""),
            address_line2=address_data.get("line2", ""),
            city=address_data.get("city", ""),
            postal_code=address_data.get("postal_code", ""),
            delivery_notes=delivery_notes or address_data.get("notes", ""),
            subtotal_cents=subtotal,
            tax_cents=tax_cents,
            total_cents=total_cents,
            status=Order.Status.PENDING,
            region=region,
            **validated_data,
        )

        order_items = []
        for item in items_data:
            product = product_map[item["product_id"]]
            unit_price = product.price_cents
            quantity = item["quantity"]
            order_items.append(
                OrderItem(
                    order=order,
                    product=product,
                    product_name=product.name,
                    quantity=quantity,
                    unit_price_cents=unit_price,
                    total_cents=unit_price * quantity,
                )
            )
        OrderItem.objects.bulk_create(order_items)
        return order


class OrderDetailSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    region = serializers.CharField(source="region.code", read_only=True)
    region_name = serializers.CharField(source="region.name", read_only=True)
    expected_delivery_date = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            "id",
            "full_name",
            "email",
            "phone",
            "order_type",
            "status",
            "subtotal_cents",
            "tax_cents",
            "total_cents",
            "address_line1",
            "address_line2",
            "city",
            "postal_code",
            "notes",
            "delivery_notes",
            "pickup_location",
            "pickup_instructions",
            "stripe_payment_intent_id",
            "estimated_delivery_at",
            "delivered_at",
            "expected_delivery_date",
            "region",
            "region_name",
            "items",
            "created_at",
        ]
        read_only_fields = fields

    def get_expected_delivery_date(self, obj):
        if not obj.region:
            return None
        target_weekday = obj.region.delivery_weekday
        base = (obj.created_at or obj.estimated_delivery_at or None)
        from django.utils import timezone
        if base:
            base_date = timezone.localdate(base)
        else:
            base_date = timezone.localdate()
        if target_weekday is None:
            return None
        days_ahead = (target_weekday - base_date.weekday()) % 7
        if days_ahead == 0:
            days_ahead = 7
        return (base_date + timezone.timedelta(days=days_ahead)).isoformat()
