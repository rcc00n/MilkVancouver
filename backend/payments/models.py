from django.db import models

from orders.models import Order


class Payment(models.Model):
    class Provider(models.TextChoices):
        STRIPE = "stripe", "Stripe"

    class Kind(models.TextChoices):
        CHARGE = "charge", "Charge"
        REFUND = "refund", "Refund"

    class Status(models.TextChoices):
        REQUIRES_PAYMENT_METHOD = "requires_payment_method", "Requires Payment Method"
        REQUIRES_CONFIRMATION = "requires_confirmation", "Requires Confirmation"
        REQUIRES_ACTION = "requires_action", "Requires Action"
        REQUIRES_CAPTURE = "requires_capture", "Requires Capture"
        PROCESSING = "processing", "Processing"
        SUCCEEDED = "succeeded", "Succeeded"
        CANCELED = "canceled", "Canceled"

    order = models.ForeignKey(
        Order, related_name="payments", on_delete=models.CASCADE
    )
    provider = models.CharField(
        max_length=20, choices=Provider.choices, default=Provider.STRIPE
    )
    kind = models.CharField(
        max_length=20, choices=Kind.choices, default=Kind.CHARGE
    )
    amount_cents = models.PositiveIntegerField()
    currency = models.CharField(max_length=10, default="cad")
    status = models.CharField(max_length=64, default=Status.REQUIRES_PAYMENT_METHOD)
    stripe_payment_intent_id = models.CharField(
        max_length=255, blank=True, default=""
    )
    stripe_charge_id = models.CharField(max_length=255, blank=True, default="")
    raw_payload = models.JSONField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["order", "created_at"]),
            models.Index(fields=["stripe_payment_intent_id"]),
        ]

    def __str__(self):
        return f"Payment {self.id} for order {self.order_id} ({self.provider} {self.status})"
