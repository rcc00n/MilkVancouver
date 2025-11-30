from typing import Any, Dict

from orders.models import Order

from .models import Payment


def record_stripe_payment_from_intent(
    order: Order, intent_data: Dict[str, Any]
) -> Payment:
    """
    Create or update a Payment for the given order from a Stripe PaymentIntent payload.
    """
    intent_id = intent_data["id"]
    amount_cents: int = intent_data["amount"]
    currency: str = intent_data.get("currency", "cad")
    status: str = intent_data.get("status", "")

    charges = intent_data.get("charges", {}) or {}
    charges_data = charges.get("data", []) if isinstance(charges, dict) else []
    stripe_charge_id = ""
    if charges_data:
        first_charge = charges_data[0]
        if isinstance(first_charge, dict):
            stripe_charge_id = first_charge.get("id", "") or ""

    payment, created = Payment.objects.get_or_create(
        order=order,
        stripe_payment_intent_id=intent_id,
        defaults={
            "provider": Payment.Provider.STRIPE,
            "kind": Payment.Kind.CHARGE,
            "amount_cents": amount_cents,
            "currency": currency,
            "status": status,
            "stripe_charge_id": stripe_charge_id,
            "raw_payload": intent_data,
        },
    )

    if not created:
        payment.amount_cents = amount_cents
        payment.currency = currency
        payment.status = status
        payment.stripe_charge_id = stripe_charge_id
        payment.raw_payload = intent_data
        payment.save(
            update_fields=[
                "amount_cents",
                "currency",
                "status",
                "stripe_charge_id",
                "raw_payload",
                "updated_at",
            ]
        )

    return payment
