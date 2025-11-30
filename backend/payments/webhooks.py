import os
from typing import Any, Dict

import stripe
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.tasks import send_order_receipt_email_task
from orders.models import Order
from .services import record_stripe_payment_from_intent

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "sk_test_placeholder")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")


def _to_dict(value: Any) -> Dict[str, Any]:
    if isinstance(value, dict):
        return value
    if hasattr(value, "to_dict"):
        try:
            return value.to_dict()  # type: ignore[arg-type]
        except Exception:
            pass
    return {}


class StripeWebhookView(APIView):
    permission_classes = []  # AllowAny without default permission checks
    authentication_classes = []  # Webhooks are authenticated by Stripe signature, not sessions

    def post(self, request, *args, **kwargs):
        payload: bytes = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

        if STRIPE_WEBHOOK_SECRET:
            try:
                event = stripe.Webhook.construct_event(
                    payload.decode("utf-8"), sig_header, STRIPE_WEBHOOK_SECRET
                )
            except (ValueError, stripe.error.SignatureVerificationError):
                return Response(status=status.HTTP_400_BAD_REQUEST)
        else:
            event = request.data

        event_dict: Dict[str, Any] = _to_dict(event)
        event_type = event_dict.get("type") or getattr(event, "type", None)
        data_object = (event_dict.get("data") or {}).get("object")

        if not isinstance(data_object, dict):
            data_object = _to_dict(data_object)

        if event_type == "payment_intent.succeeded" and data_object:
            intent_data: Dict[str, Any] = _to_dict(data_object)
            payment_intent_id = intent_data.get("id", "")
            metadata = intent_data.get("metadata") or {}
            order_id = metadata.get("order_id") if hasattr(metadata, "get") else None

            if not order_id:
                return Response({"detail": "No order_id in metadata"}, status=status.HTTP_200_OK)

            order = Order.objects.filter(id=order_id).first()
            if order:
                order.status = Order.Status.PAID
                order.stripe_payment_intent_id = payment_intent_id or ""
                order.save(update_fields=["status", "stripe_payment_intent_id", "updated_at"])

                record_stripe_payment_from_intent(order, intent_data)
                send_order_receipt_email_task.delay(order.id)

        return Response({"received": True}, status=status.HTTP_200_OK)
