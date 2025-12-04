from django.contrib import admin
from django.db.models import Sum
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils import timezone
from datetime import timedelta
from django.utils.html import format_html

from notifications.models import EmailNotification

from .models import Order, OrderItem, Region

STATUS_COLORS = {
    Order.Status.PENDING: ("#fef9c3", "#854d0e"),  # yellow
    Order.Status.PAID: ("#dbeafe", "#1d4ed8"),  # blue
    Order.Status.IN_PROGRESS: ("#ede9fe", "#6b21a8"),  # purple
    Order.Status.READY: ("#fff7ed", "#c2410c"),  # orange
    Order.Status.COMPLETED: ("#ecfdf3", "#15803d"),  # green
    Order.Status.CANCELLED: ("#fef2f2", "#b91c1c"),  # red
}

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 1
    fields = (
        "product",
        "product_name",
        "quantity",
        "unit_price_display",
        "line_total_display",
    )
    readonly_fields = ("product_name", "unit_price_display", "line_total_display")
    show_change_link = False

    def unit_price_display(self, obj):
        if not obj or obj.unit_price_cents is None:
            return "—"
        return f"${obj.unit_price_cents / 100:.2f}"

    unit_price_display.short_description = "Unit price"

    def line_total_display(self, obj):
        if not obj or obj.total_cents is None:
            return "—"
        return f"${obj.total_cents / 100:.2f}"

    line_total_display.short_description = "Line total"


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ("code", "name", "delivery_weekday", "min_orders")
    list_editable = ("delivery_weekday", "min_orders")
    list_filter = ("delivery_weekday",)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "full_name",
        "region_display",
        "delivery_state_badge",
        "expected_delivery_display",
        "subtotal_display",
        "tax_display",
        "total_display",
        "created_at",
        "latest_receipt_link",
    )
    list_display_links = ("id", "full_name")
    list_filter = (
        "delivered_at",
        ("created_at", admin.DateFieldListFilter),
        "region",
    )
    search_fields = ("full_name", "email", "id")
    readonly_fields = (
        "delivery_state_badge",
        "expected_delivery_display",
        "subtotal_display",
        "tax_display",
        "total_display",
        "subtotal_cents",
        "tax_cents",
        "total_cents",
        "stripe_payment_intent_id",
        "created_at",
        "updated_at",
        "latest_receipt_link",
    )
    fieldsets = (
        (
            "Order",
            {
                "fields": (
                    "delivery_state_badge",
                    "expected_delivery_display",
                    "notes",
                )
            },
        ),
        (
            "Customer",
            {"fields": ("full_name", "email", "phone")},
        ),
        (
            "Delivery Details",
            {
                "fields": (
                    "address_line1",
                    "address_line2",
                    "city",
                    "postal_code",
                    "delivery_notes",
                )
            },
        ),
        (
            "Logistics",
            {
                "fields": (
                    "region",
                    "estimated_delivery_at",
                    "delivered_at",
                )
            },
        ),
        (
            "Totals",
            {
                "fields": (
                    "subtotal_display",
                    "tax_display",
                    "total_display",
                    "stripe_payment_intent_id",
                )
            },
        ),
        ("Receipts", {"fields": ("latest_receipt_link",)}),
        ("Metadata", {"fields": ("created_at", "updated_at")}),
    )
    inlines = [OrderItemInline]
    actions = [
        "mark_delivered",
        "mark_not_delivered",
    ]

    def delivery_state_badge(self, obj):
        delivered = bool(obj.delivered_at)
        bg, color, label = (
            ("#ecfdf3", "#166534", "Delivered")
            if delivered
            else ("#f8fafc", "#475569", "Not delivered")
        )
        return format_html(
            '<span style="padding:4px 8px;border-radius:8px;background:{};color:{};font-weight:700;">{}</span>',
            bg,
            color,
            label,
        )

    delivery_state_badge.short_description = "Delivery status"
    delivery_state_badge.admin_order_field = "delivered_at"

    @staticmethod
    def _format_cents(value):
        return f"${(value or 0) / 100:.2f}"

    def subtotal_display(self, obj):
        return self._format_cents(obj.subtotal_cents)

    subtotal_display.short_description = "Subtotal"
    subtotal_display.admin_order_field = "subtotal_cents"

    def tax_display(self, obj):
        return self._format_cents(obj.tax_cents)

    tax_display.short_description = "Tax"
    tax_display.admin_order_field = "tax_cents"

    def total_display(self, obj):
        return self._format_cents(obj.total_cents)

    total_display.short_description = "Total"
    total_display.admin_order_field = "total_cents"

    def region_display(self, obj):
        if not obj.region:
            return "—"
        return obj.region.name

    region_display.short_description = "Region"
    region_display.admin_order_field = "region__name"

    def expected_delivery_display(self, obj):
        expected_date = self._compute_expected_delivery_date(obj)
        if not expected_date:
            return "—"
        return expected_date.strftime("%Y-%m-%d")

    expected_delivery_display.short_description = "Expected delivery"
    expected_delivery_display.admin_order_field = "estimated_delivery_at"

    def save_formset(self, request, form, formset, change):
        instances = formset.save(commit=False)
        for obj in formset.deleted_objects:
            obj.delete()
        for instance in instances:
            instance.product_name = instance.product.name
            instance.unit_price_cents = instance.product.price_cents
            instance.total_cents = instance.unit_price_cents * instance.quantity
            instance.save()
        formset.save_m2m()
        self._recalculate_totals(form.instance)

    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)
        self._recalculate_totals(obj)

    def _recalculate_totals(self, order):
        subtotal = sum(item.total_cents for item in order.items.all())
        order.subtotal_cents = subtotal
        order.total_cents = subtotal + (order.tax_cents or 0)
        order.save(
            update_fields=[
                "subtotal_cents",
                "total_cents",
                "updated_at",
            ]
        )

    @admin.action(description="Mark as Delivered")
    def mark_delivered(self, request, queryset):
        now = timezone.now()
        updated = queryset.update(
            status=Order.Status.COMPLETED,
            delivered_at=now,
            updated_at=now,
        )
        self.message_user(request, f"{updated} order(s) marked Delivered.")

    @admin.action(description="Mark as Not Delivered")
    def mark_not_delivered(self, request, queryset):
        updated = queryset.update(
            delivered_at=None,
            updated_at=timezone.now(),
        )
        self.message_user(request, f"{updated} order(s) marked Not Delivered.")

    def _compute_expected_delivery_date(self, obj):
        if not obj.region:
            return None
        target_weekday = obj.region.delivery_weekday
        if target_weekday is None:
            return None
        base_date = timezone.localdate(obj.created_at or timezone.now())
        days_ahead = (target_weekday - base_date.weekday()) % 7
        if days_ahead == 0:
            days_ahead = 7
        return base_date + timedelta(days=days_ahead)

    def latest_receipt_link(self, obj):
        notification = (
            EmailNotification.objects.filter(
                order=obj, kind="order_receipt"
            )
            .order_by("-sent_at", "-created_at")
            .first()
        )
        if notification and notification.receipt_pdf:
            return format_html(
                '<a href="{}" target="_blank" rel="noopener">View receipt</a>',
                notification.receipt_pdf.url,
            )
        return "—"

    latest_receipt_link.short_description = "Latest Receipt"


def orders_dashboard(request):
    today = timezone.now().date()
    todays_orders = Order.objects.filter(created_at__date=today)
    revenue_today_cents = (
        todays_orders.aggregate(total=Sum("total_cents"))["total"] or 0
    )
    context = {
        **admin.site.each_context(request),
        "title": "Orders Dashboard",
        "total_orders_today": todays_orders.count(),
        "pending_orders": Order.objects.filter(status=Order.Status.PENDING).count(),
        "in_progress_orders": Order.objects.filter(
            status=Order.Status.IN_PROGRESS
        ).count(),
        "ready_orders": Order.objects.filter(status=Order.Status.READY).count(),
        "completed_orders_today": todays_orders.filter(
            status=Order.Status.COMPLETED
        ).count(),
        "revenue_today": revenue_today_cents,
        "revenue_today_display": revenue_today_cents / 100,
        "pending_url": reverse("admin:orders_order_changelist") + "?status=pending",
        "ready_url": reverse("admin:orders_order_changelist") + "?status=ready",
        "add_order_url": reverse("admin:orders_order_add"),
    }
    return TemplateResponse(request, "admin/orders_dashboard.html", context)


def get_admin_urls(urls):
    def wrapper():
        custom_urls = [
            path(
                "orders-dashboard/",
                admin.site.admin_view(orders_dashboard),
                name="orders-dashboard",
            ),
        ]
        return custom_urls + urls()

    return wrapper


admin.site.get_urls = get_admin_urls(admin.site.get_urls)
