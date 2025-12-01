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

    class Meta:
        model = RouteStop
        fields = ["id", "sequence", "status", "delivered_at", "order"]
        read_only_fields = fields


class DeliveryRouteSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source="region.name", read_only=True)
    driver_name = serializers.SerializerMethodField()
    stops = RouteStopSerializer(many=True, read_only=True)

    class Meta:
        model = DeliveryRoute
        fields = [
            "id",
            "date",
            "region",
            "region_name",
            "driver_name",
            "is_completed",
            "stops",
        ]
        read_only_fields = fields

    def get_driver_name(self, obj):
        if not obj.driver:
            return "Unassigned"
        user = obj.driver.user
        full_name = user.get_full_name() if hasattr(user, "get_full_name") else ""
        return full_name or getattr(user, "email", "") or getattr(user, "username", "") or "Unassigned"
