import os
from typing import Any, Dict

import stripe
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from notifications.emails import send_order_receipt_email_once
from orders.models import Order
from .services import record_stripe_payment_from_intent

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "sk_test_placeholder")
STRIPE_WEBHOOK_SECRET = os.environ.get("STRIPE_WEBHOOK_SECRET", "")


class StripeWebhookView(APIView):
    def post(self, request, *args, **kwargs):
        payload = request.body
        sig_header = request.META.get("HTTP_STRIPE_SIGNATURE")

        if STRIPE_WEBHOOK_SECRET:
            try:
                event = stripe.Webhook.construct_event(
                    payload, sig_header, STRIPE_WEBHOOK_SECRET
                )
            except (ValueError, stripe.error.SignatureVerificationError):
                return Response(status=status.HTTP_400_BAD_REQUEST)
        else:
            event = request.data

        event_type = event.get("type") if isinstance(event, dict) else getattr(event, "type", None)
        data_object = (
            event.get("data", {}).get("object")
            if isinstance(event, dict)
            else getattr(getattr(event, "data", None), "object", None)
        )

        if event_type == "payment_intent.succeeded" and data_object:
            payment_intent_id = (
                data_object.get("id")
                if isinstance(data_object, dict)
                else getattr(data_object, "id", None)
            )
            metadata = (
                data_object.get("metadata") if isinstance(data_object, dict) else getattr(data_object, "metadata", {})
            ) or {}
            order_id = metadata.get("order_id") if hasattr(metadata, "get") else getattr(metadata, "order_id", None)

            if not order_id:
                return Response({"detail": "No order_id in metadata"}, status=status.HTTP_200_OK)

            order = Order.objects.filter(id=order_id).first()
            if order:
                order.status = Order.Status.PAID
                order.stripe_payment_intent_id = payment_intent_id or ""
                order.save(update_fields=["status", "stripe_payment_intent_id", "updated_at"])

                intent_dict: Dict[str, Any]
                if isinstance(data_object, dict):
                    intent_dict = data_object
                else:
                    intent_dict = {
                        "id": getattr(data_object, "id", ""),
                        "amount": getattr(data_object, "amount", 0),
                        "currency": getattr(data_object, "currency", "cad"),
                        "status": getattr(data_object, "status", ""),
                    }

                record_stripe_payment_from_intent(order, intent_dict)
                send_order_receipt_email_once(order)

        return Response({"received": True}, status=status.HTTP_200_OK)
