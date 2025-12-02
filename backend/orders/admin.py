from django.contrib import admin
from django.core.exceptions import PermissionDenied
from django.db.models import Sum
from django.shortcuts import get_object_or_404, redirect
from django.template.response import TemplateResponse
from django.urls import path, reverse
from django.utils import timezone
from django.utils.html import format_html
from django.utils.html import format_html_join

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

ORDER_TYPE_COLORS = {
    Order.OrderType.PICKUP: ("#e0f2fe", "#0369a1"),
    Order.OrderType.DELIVERY: ("#dcfce7", "#166534"),
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
        "order_type_badge",
        "colored_status",
        "status_shortcuts",
        "subtotal_display",
        "tax_display",
        "total_display",
        "created_at",
        "latest_receipt_link",
    )
    list_display_links = ("id", "full_name")
    list_filter = (
        "status",
        "order_type",
        ("created_at", admin.DateFieldListFilter),
        "region",
    )
    search_fields = ("full_name", "email", "id")
    readonly_fields = (
        "order_type_badge",
        "colored_status",
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
                    "order_type",
                    "status",
                    "order_type_badge",
                    "colored_status",
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
            "Pickup Details",
            {
                "fields": (
                    "pickup_location",
                    "pickup_instructions",
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
        "mark_in_progress",
        "mark_ready",
        "mark_completed",
        "mark_cancelled",
    ]

    def order_type_badge(self, obj):
        bg, color = ORDER_TYPE_COLORS.get(
            obj.order_type, ("#e5e7eb", "#1f2937")
        )
        return format_html(
            '<span style="padding:4px 8px;border-radius:999px;background:{};color:{};font-weight:700;">{}</span>',
            bg,
            color,
            obj.get_order_type_display(),
        )

    order_type_badge.short_description = "Order Type"
    order_type_badge.admin_order_field = "order_type"

    def colored_status(self, obj):
        bg, color = STATUS_COLORS.get(obj.status, ("#e5e7eb", "#1f2937"))
        return format_html(
            '<span style="padding:4px 8px;border-radius:8px;background:{};color:{};font-weight:700;text-transform:capitalize;">{}</span>',
            bg,
            color,
            obj.get_status_display(),
        )

    colored_status.short_description = "Status"
    colored_status.admin_order_field = "status"

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

    @admin.action(description="Mark as In Progress")
    def mark_in_progress(self, request, queryset):
        updated = queryset.update(
            status=Order.Status.IN_PROGRESS, updated_at=timezone.now()
        )
        self.message_user(request, f"{updated} order(s) marked In Progress.")

    @admin.action(description="Mark as Ready")
    def mark_ready(self, request, queryset):
        updated = queryset.update(
            status=Order.Status.READY, updated_at=timezone.now()
        )
        self.message_user(request, f"{updated} order(s) marked Ready.")

    @admin.action(description="Mark as Completed")
    def mark_completed(self, request, queryset):
        updated = queryset.update(
            status=Order.Status.COMPLETED, updated_at=timezone.now()
        )
        self.message_user(request, f"{updated} order(s) marked Completed.")

    @admin.action(description="Mark as Cancelled")
    def mark_cancelled(self, request, queryset):
        updated = queryset.update(
            status=Order.Status.CANCELLED, updated_at=timezone.now()
        )
        self.message_user(request, f"{updated} order(s) marked Cancelled.")

    def status_shortcuts(self, obj):
        # Render a compact dropdown for changing status instead of multiple tiny buttons
        options = [
            format_html('<option value="">{}</option>', "Change status…"),
        ]
        for status_value, label, _, _ in [
            (Order.Status.IN_PROGRESS, "In Progress", "#ede9fe", "#6b21a8"),
            (Order.Status.READY, "Ready", "#fff7ed", "#c2410c"),
            (Order.Status.COMPLETED, "Completed", "#ecfdf3", "#15803d"),
            (Order.Status.CANCELLED, "Cancelled", "#fef2f2", "#b91c1c"),
        ]:
            if obj.status == status_value:
                continue
            url = reverse("admin:orders_order_set_status", args=[obj.pk, status_value])
            options.append(format_html('<option value="{}">{}</option>', url, label))

        return format_html(
            '<select style="min-width:150px;padding:4px 8px;border-radius:8px;'
            'border:1px solid #d1d5db;background:#0f172a;color:#e5e7eb;" '
            'onchange="if(this.value){{window.location.href=this.value;this.selectedIndex=0;}}">'
            "{}</select>",
            format_html_join("", "{}", ((option,) for option in options)),
        )

    status_shortcuts.short_description = "Quick Status"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path(
                "<int:order_id>/set-status/<str:new_status>/",
                self.admin_site.admin_view(self.set_status),
                name="orders_order_set_status",
            )
        ]
        return custom_urls + urls

    def set_status(self, request, order_id, new_status):
        if not request.user.has_perm("orders.change_order"):
            raise PermissionDenied
        if new_status not in Order.Status.values:
            self.message_user(request, "Invalid status.", level="error")
            return redirect("admin:orders_order_changelist")
        order = get_object_or_404(Order, pk=order_id)
        order.status = new_status
        order.updated_at = timezone.now()
        order.save(update_fields=["status", "updated_at"])
        self.message_user(
            request,
            f"Order #{order.id} updated to {order.get_status_display()}.",
        )
        referer = request.META.get("HTTP_REFERER")
        if referer:
            return redirect(referer)
        return redirect("admin:orders_order_changelist")

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
