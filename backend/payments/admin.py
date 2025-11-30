from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "order",
        "provider",
        "kind",
        "amount_cents",
        "currency",
        "status",
        "stripe_payment_intent_id",
        "created_at",
    )
    list_filter = ("provider", "kind", "status")
    search_fields = (
        "order__id",
        "stripe_payment_intent_id",
        "stripe_charge_id",
        "status",
        "provider",
    )
    date_hierarchy = "created_at"
    readonly_fields = ("created_at", "updated_at")
