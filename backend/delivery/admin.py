from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html

from .models import DeliveryProof, DeliveryRoute, Driver, RouteStop


class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 0
    fields = ("sequence", "order_link", "status", "delivered_at")
    readonly_fields = ("order_link",)
    ordering = ("sequence",)

    def order_link(self, obj):
        if not obj or not getattr(obj, "order_id", None):
            return "—"
        url = reverse("admin:orders_order_change", args=[obj.order_id])
        return format_html('<a href="{}">Order #{}</a>', url, obj.order_id)

    order_link.short_description = "Order"


@admin.register(DeliveryRoute)
class DeliveryRouteAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "date",
        "region",
        "driver",
        "stops_count",
        "is_completed",
        "created_at",
    )
    date_hierarchy = "date"
    search_fields = (
        "region__code",
        "region__name",
        "driver__user__email",
        "driver__user__first_name",
        "driver__user__last_name",
    )
    list_filter = (
        "region",
        "driver",
        "is_completed",
        ("date", admin.DateFieldListFilter),
        ("stops__status", admin.ChoicesFieldListFilter),
    )
    inlines = [RouteStopInline]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("region", "driver", "driver__user")

    def stops_count(self, obj):
        return obj.stops.count()

    stops_count.short_description = "Stops"


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    list_display = ("user", "phone", "short_notes", "active_routes_count")
    search_fields = (
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
        "phone",
    )
    list_select_related = ("user",)

    def short_notes(self, obj):
        if not obj.notes:
            return "—"
        return (obj.notes[:37] + "...") if len(obj.notes) > 40 else obj.notes

    short_notes.short_description = "Notes"

    def active_routes_count(self, obj):
        return obj.routes.filter(is_completed=False).count()

    active_routes_count.short_description = "Active Routes"


@admin.register(RouteStop)
class RouteStopAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "route",
        "sequence",
        "order",
        "region",
        "driver",
        "status",
        "delivered_at",
    )
    list_filter = (
        "status",
        "route__region",
        "route__driver",
        ("route__date", admin.DateFieldListFilter),
    )
    search_fields = (
        "order__id",
        "order__full_name",
        "route__region__code",
        "route__region__name",
        "route__driver__user__email",
    )
    ordering = ("route__date", "route__region__code", "sequence")
    autocomplete_fields = ("route", "order")

    def region(self, obj):
        return obj.route.region if obj and obj.route else None

    region.short_description = "Region"

    def driver(self, obj):
        return obj.route.driver if obj and obj.route else None

    driver.short_description = "Driver"


@admin.register(DeliveryProof)
class DeliveryProofAdmin(admin.ModelAdmin):
    list_display = ("id", "stop", "route", "driver", "photo", "created_at")
    readonly_fields = ("created_at",)

    def route(self, obj):
        return obj.stop.route if obj and obj.stop else None

    route.short_description = "Route"

    def driver(self, obj):
        if obj and obj.stop and obj.stop.route:
            return obj.stop.route.driver
        return None

    driver.short_description = "Driver"
