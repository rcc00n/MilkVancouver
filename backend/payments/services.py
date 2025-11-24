from typing import Any, Dict

from orders.models import Order

from .models import Payment


def record_stripe_payment_from_intent(
    order: Order, intent_data: Dict[str, Any]
) -> Payment:
    """
    Create (or update) a Payment record for the given Order based on a Stripe PaymentIntent payload.
    Use:
      - provider='stripe'
      - kind='charge'
      - amount_cents=intent_data['amount']
      - currency=intent_data.get('currency', 'cad')
      - status=intent_data.get('status', 'succeeded')
      - stripe_payment_intent_id=intent_data['id']
      - raw_payload=intent_data
    If a Payment with this stripe_payment_intent_id already exists, update its status,
    raw_payload and amount fields instead of creating a new row.
    Return the Payment instance.
    """
    amount_cents = intent_data["amount"]
    currency = intent_data.get("currency", "cad")
    status = intent_data.get("status", "succeeded")
    stripe_payment_intent_id = intent_data["id"]

    existing = Payment.objects.filter(
        stripe_payment_intent_id=stripe_payment_intent_id
    ).first()
    if existing:
        existing.order = order
        existing.amount_cents = amount_cents
        existing.currency = currency
        existing.status = status
        existing.raw_payload = intent_data
        if not existing.stripe_payment_intent_id:
            existing.stripe_payment_intent_id = stripe_payment_intent_id
        existing.save(
            update_fields=[
                "order",
                "amount_cents",
                "currency",
                "status",
                "raw_payload",
                "stripe_payment_intent_id",
                "updated_at",
            ]
        )
        return existing

    return Payment.objects.create(
        order=order,
        provider=Payment.Provider.STRIPE,
        kind=Payment.Kind.CHARGE,
        amount_cents=amount_cents,
        currency=currency,
        status=status,
        stripe_payment_intent_id=stripe_payment_intent_id,
        raw_payload=intent_data,
    )
