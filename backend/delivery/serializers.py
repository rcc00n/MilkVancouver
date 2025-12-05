from rest_framework import serializers

from delivery.models import DeliveryRoute, RouteStop
from orders.models import Order


class RouteStopOrderSerializer(serializers.ModelSerializer):
    class Meta:
        model = Order
        fields = [
            "id",
            "full_name",
            "address_line1",
            "city",
            "postal_code",
            "phone",
        ]
        read_only_fields = fields


class RouteStopSerializer(serializers.ModelSerializer):
    order = RouteStopOrderSerializer(read_only=True)
    has_proof = serializers.SerializerMethodField()
    proof_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = RouteStop
        fields = [
            "id",
            "sequence",
            "status",
            "delivered_at",
            "has_proof",
            "proof_photo_url",
            "order",
        ]
        read_only_fields = fields

    def get_has_proof(self, obj):
        return hasattr(obj, "delivery_proof")

    def get_proof_photo_url(self, obj):
        proof = getattr(obj, "delivery_proof", None)
        if not proof or not proof.photo:
            return ""
        request = self.context.get("request")
        url = proof.photo.url
        return request.build_absolute_uri(url) if request else url


class DeliveryRouteSerializer(serializers.ModelSerializer):
    region_code = serializers.CharField(source="region.code", read_only=True)
    region_name = serializers.CharField(source="region.name", read_only=True)
    driver_id = serializers.IntegerField(
        source="driver.id", read_only=True, allow_null=True
    )
    driver_name = serializers.SerializerMethodField()
    stops = RouteStopSerializer(many=True, read_only=True)
    stops_count = serializers.IntegerField(read_only=True)
    merged_into_id = serializers.IntegerField(read_only=True, allow_null=True)
    merged_at = serializers.DateTimeField(read_only=True, allow_null=True)
    driver_preferences = serializers.SerializerMethodField()

    class Meta:
        model = DeliveryRoute
        fields = [
            "id",
            "date",
            "region",
            "region_code",
            "region_name",
            "driver_id",
            "driver_name",
            "is_completed",
            "merged_into_id",
            "merged_at",
            "driver_preferences",
            "stops",
            "stops_count",
        ]
        read_only_fields = fields

    def get_driver_name(self, obj):
        if not obj.driver:
            return "Unassigned"
        user = obj.driver.user
        full_name = user.get_full_name() if hasattr(user, "get_full_name") else ""
        return full_name or getattr(user, "email", "") or getattr(user, "username", "") or "Unassigned"

    def get_driver_preferences(self, obj):
        driver = obj.driver
        if not driver:
            return None
        preferred_region = getattr(driver, "preferred_region", None)
        return {
            "operating_weekdays": driver.operating_weekdays or [],
            "preferred_region_id": preferred_region.id if preferred_region else None,
            "preferred_region_code": preferred_region.code if preferred_region else "",
            "preferred_region_name": preferred_region.name if preferred_region else "",
            "min_stops_for_dedicated_route": driver.min_stops_for_dedicated_route,
        }


class DriverRouteStopSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source="order.id", read_only=True)
    client_name = serializers.CharField(source="order.full_name", read_only=True)
    client_phone = serializers.CharField(source="order.phone", read_only=True)
    address = serializers.SerializerMethodField()
    has_proof = serializers.SerializerMethodField()
    proof_photo_url = serializers.SerializerMethodField()

    class Meta:
        model = RouteStop
        fields = [
            "id",
            "sequence",
            "status",
            "delivered_at",
            "has_proof",
            "proof_photo_url",
            "order_id",
            "client_name",
            "client_phone",
            "address",
        ]
        read_only_fields = [
            "id",
            "sequence",
            "order_id",
            "client_name",
            "client_phone",
            "address",
            "has_proof",
            "proof_photo_url",
        ]

    def get_address(self, obj):
        order = obj.order
        parts = [
            getattr(order, "address_line1", ""),
            getattr(order, "address_line2", ""),
            getattr(order, "city", ""),
            getattr(order, "postal_code", ""),
        ]
        return ", ".join(part for part in parts if part)

    def get_has_proof(self, obj):
        return hasattr(obj, "delivery_proof")

    def get_proof_photo_url(self, obj):
        proof = getattr(obj, "delivery_proof", None)
        if not proof or not proof.photo:
            return ""
        request = self.context.get("request")
        url = proof.photo.url
        return request.build_absolute_uri(url) if request else url


class DriverRouteSerializer(serializers.ModelSerializer):
    region_code = serializers.CharField(source="region.code", read_only=True)
    region_name = serializers.CharField(source="region.name", read_only=True)
    driver_name = serializers.SerializerMethodField()
    stops = DriverRouteStopSerializer(many=True, read_only=True)
    merged_into_id = serializers.IntegerField(read_only=True, allow_null=True)

    class Meta:
        model = DeliveryRoute
        fields = [
            "id",
            "date",
            "region",
            "region_code",
            "region_name",
            "driver_name",
            "is_completed",
            "merged_into_id",
            "stops",
        ]
        read_only_fields = fields

    def get_driver_name(self, obj):
        if not obj.driver:
            return "Unassigned"
        user = obj.driver.user
        full_name = user.get_full_name() if hasattr(user, "get_full_name") else ""
        return (
            full_name
            or getattr(user, "email", "")
            or getattr(user, "username", "")
            or "Unassigned"
        )


class DriverUpcomingRouteSerializer(serializers.ModelSerializer):
    region_code = serializers.CharField(source="region.code", read_only=True)
    region_name = serializers.CharField(source="region.name", read_only=True)
    stops_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = DeliveryRoute
        fields = [
            "id",
            "date",
            "region",
            "region_code",
            "region_name",
            "stops_count",
        ]
        read_only_fields = fields
