from django import forms
from django.contrib import admin
from django.urls import reverse
from django.utils.html import format_html

from .models import DeliveryProof, DeliveryRoute, Driver, RouteStop


class DeliveryProofInline(admin.StackedInline):
    model = DeliveryProof
    extra = 0
    fields = ("photo", "thumbnail", "created_at")
    readonly_fields = ("thumbnail", "created_at")

    def thumbnail(self, obj):
        if obj and getattr(obj, "photo", None):
            return format_html(
                '<img src="{}" style="max-height:120px;max-width:200px;" alt="Proof photo" />',
                obj.photo.url,
            )
        return "—"

    thumbnail.short_description = "Preview"


class RouteStopInline(admin.TabularInline):
    model = RouteStop
    extra = 0
    fields = ("sequence", "order", "order_link", "status", "delivered_at")
    readonly_fields = ("order_link",)
    autocomplete_fields = ("order",)
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
        "merged_into",
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
        "merged_into",
        "is_completed",
        ("date", admin.DateFieldListFilter),
        ("stops__status", admin.ChoicesFieldListFilter),
    )
    inlines = [RouteStopInline]

    def get_queryset(self, request):
        queryset = super().get_queryset(request)
        return queryset.select_related("region", "driver", "driver__user", "driver__preferred_region")

    def stops_count(self, obj):
        return obj.stops.count()

    stops_count.short_description = "Stops"

    def get_readonly_fields(self, request, obj=None):
        readonly = list(super().get_readonly_fields(request, obj))
        if obj and obj.merged_into_id:
            readonly.extend(
                [
                    "driver",
                    "region",
                    "date",
                ]
            )
        return readonly

    def has_delete_permission(self, request, obj=None):
        if obj and getattr(obj, "merged_into_id", None):
            return False
        return super().has_delete_permission(request, obj)

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        if not getattr(obj, "is_merged", False):
            obj.refresh_completion_status(save=True)


WEEKDAY_CHOICES = (
    (0, "Mon"),
    (1, "Tue"),
    (2, "Wed"),
    (3, "Thu"),
    (4, "Fri"),
    (5, "Sat"),
    (6, "Sun"),
)


class DriverAdminForm(forms.ModelForm):
    operating_weekdays = forms.MultipleChoiceField(
        choices=WEEKDAY_CHOICES,
        required=False,
        widget=forms.CheckboxSelectMultiple,
        help_text="Days this driver normally operates.",
    )

    class Meta:
        model = Driver
        fields = "__all__"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        initial_days = self.instance.operating_weekdays or []
        self.fields["operating_weekdays"].initial = [
            int(day) for day in initial_days if isinstance(day, (int, str))
        ]

    def clean_operating_weekdays(self):
        value = self.cleaned_data.get("operating_weekdays") or []
        normalized = sorted({int(day) for day in value})
        return normalized


@admin.register(Driver)
class DriverAdmin(admin.ModelAdmin):
    form = DriverAdminForm
    list_display = (
        "user",
        "phone",
        "short_notes",
        "formatted_weekdays",
        "preferred_region",
        "min_stops_for_dedicated_route",
        "active_routes_count",
    )
    search_fields = (
        "user__username",
        "user__email",
        "user__first_name",
        "user__last_name",
        "phone",
    )
    list_filter = ("preferred_region",)
    fieldsets = (
        (
            "Identity",
            {
                "fields": (
                    "user",
                    "phone",
                    "notes",
                )
            },
        ),
        (
            "Dispatch preferences",
            {
                "fields": (
                    "operating_weekdays",
                    "preferred_region",
                    "min_stops_for_dedicated_route",
                ),
            },
        ),
    )
    list_select_related = ("user",)

    def short_notes(self, obj):
        if not obj.notes:
            return "—"
        return (obj.notes[:37] + "...") if len(obj.notes) > 40 else obj.notes

    short_notes.short_description = "Notes"

    def formatted_weekdays(self, obj):
        return obj.formatted_weekdays() or "—"

    formatted_weekdays.short_description = "Days"

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
    inlines = [DeliveryProofInline]

    def region(self, obj):
        return obj.route.region if obj and obj.route else None

    region.short_description = "Region"

    def driver(self, obj):
        return obj.route.driver if obj and obj.route else None

    driver.short_description = "Driver"


@admin.register(DeliveryProof)
class DeliveryProofAdmin(admin.ModelAdmin):
    list_display = ("id", "stop", "route", "order", "thumbnail", "created_at")
    list_filter = (
        ("created_at", admin.DateFieldListFilter),
        "stop__route__region",
        "stop__route__driver",
    )
    search_fields = (
        "stop__order__id",
        "stop__route__region__code",
        "stop__route__region__name",
        "stop__route__driver__user__email",
    )
    readonly_fields = ("thumbnail", "created_at")

    def route(self, obj):
        return obj.stop.route if obj and obj.stop else None

    route.short_description = "Route"

    def order(self, obj):
        return obj.stop.order if obj and obj.stop else None

    order.short_description = "Order"

    def thumbnail(self, obj):
        if obj and getattr(obj, "photo", None):
            return format_html(
                '<img src="{}" style="max-height:120px;max-width:200px;" alt="Proof photo" />',
                obj.photo.url,
            )
        return "—"

    thumbnail.short_description = "Preview"
