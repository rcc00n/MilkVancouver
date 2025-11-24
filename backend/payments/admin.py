from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "order",
        "provider",
        "kind",
        "status",
        "amount_display",
        "created_at",
    )
    list_filter = ("provider", "kind", "status", "created_at")
    search_fields = ("id", "order__id", "stripe_payment_intent_id", "stripe_charge_id")
    readonly_fields = ("created_at", "updated_at")

    def amount_display(self, obj):
        return "$" + f"{obj.amount_cents/100:.2f}"

    amount_display.short_description = "Amount"
