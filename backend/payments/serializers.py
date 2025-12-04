from typing import Dict

from rest_framework import serializers

from orders.models import Order, Region
from products.models import Product
from .models import Payment


class OrderItemInputSerializer(serializers.Serializer):
    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class AddressSerializer(serializers.Serializer):
    line1 = serializers.CharField(required=False, allow_blank=True, default="")
    line2 = serializers.CharField(required=False, allow_blank=True, default="")
    city = serializers.CharField(required=False, allow_blank=True, default="")
    postal_code = serializers.CharField(required=False, allow_blank=True, default="")
    notes = serializers.CharField(required=False, allow_blank=True, default="")


class CheckoutCreateSerializer(serializers.Serializer):
    items = OrderItemInputSerializer(many=True)
    full_name = serializers.CharField(max_length=255)
    email = serializers.EmailField()
    phone = serializers.CharField(max_length=50)
    order_type = serializers.ChoiceField(choices=Order.OrderType.choices)
    address = AddressSerializer(required=False, allow_null=True, default=dict)
    notes = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, default=""
    )
    region_code = serializers.CharField(
        required=False, allow_blank=True, allow_null=True, max_length=32
    )

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("At least one item is required.")
        return items

    def validate(self, attrs: Dict):
        items = attrs.get("items") or []
        product_ids = [item["product_id"] for item in items]
        products_map = Product.objects.in_bulk(product_ids)

        missing_ids = sorted({pid for pid in product_ids if pid not in products_map})
        if missing_ids:
            raise serializers.ValidationError(
                {"items": f"Products not found: {', '.join(map(str, missing_ids))}."}
            )

        order_type = attrs.get("order_type")
        address = attrs.get("address") or {}
        region_code = attrs.get("region_code") or ""
        errors: Dict[str, Dict[str, str]] = {}
        resolved_region = None

        if order_type != Order.OrderType.DELIVERY:
            errors["order_type"] = ["Only delivery orders are supported."]
        required_fields = ("line1", "city", "postal_code")
        missing_fields = [
            field for field in required_fields if not (address.get(field) or "").strip()
        ]
        if missing_fields:
            errors["address"] = {
                field: "This field is required for delivery."
                for field in missing_fields
            }
        if not region_code or not str(region_code).strip():
            errors["region_code"] = ["This field is required for delivery orders."]
        else:
            resolved_region = Region.objects.filter(code__iexact=str(region_code).strip()).first()
            if not resolved_region:
                errors["region_code"] = ["Unknown region code."]

        if errors:
            raise serializers.ValidationError(errors)

        attrs["products_map"] = products_map
        attrs["region"] = resolved_region
        return attrs


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "order",
            "provider",
            "kind",
            "status",
            "amount_cents",
            "currency",
            "stripe_payment_intent_id",
            "stripe_charge_id",
            "created_at",
        ]
        read_only_fields = fields
