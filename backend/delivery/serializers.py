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


class DriverRouteStopSerializer(serializers.ModelSerializer):
    order_id = serializers.IntegerField(source="order.id", read_only=True)
    client_name = serializers.CharField(source="order.full_name", read_only=True)
    client_phone = serializers.CharField(source="order.phone", read_only=True)
    address = serializers.SerializerMethodField()

    class Meta:
        model = RouteStop
        fields = [
            "id",
            "sequence",
            "status",
            "delivered_at",
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


class DriverRouteSerializer(serializers.ModelSerializer):
    region_code = serializers.CharField(source="region.code", read_only=True)
    region_name = serializers.CharField(source="region.name", read_only=True)
    driver_name = serializers.SerializerMethodField()
    stops = DriverRouteStopSerializer(many=True, read_only=True)

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
