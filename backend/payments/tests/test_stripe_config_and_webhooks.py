import os
from unittest.mock import patch

from django.urls import reverse
from rest_framework.test import APITestCase

from orders.models import Order


class StripeConfigTests(APITestCase):
    def test_stripe_config_returns_503_when_missing_key(self):
        with patch.dict(
            os.environ,
            {"STRIPE_PUBLISHABLE_KEY": "", "VITE_STRIPE_PUBLISHABLE_KEY": ""},
            clear=False,
        ):
            response = self.client.get(reverse("stripe-config"))

        self.assertEqual(response.status_code, 503)
        self.assertIn("detail", response.json())

    def test_stripe_config_returns_key_when_configured(self):
        with patch.dict(os.environ, {"STRIPE_PUBLISHABLE_KEY": "pk_test_123"}, clear=False):
            response = self.client.get(reverse("stripe-config"))

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data.get("publishable_key"), "pk_test_123")
        self.assertFalse(data.get("livemode"))


class StripeWebhookTests(APITestCase):
    def _create_order(self):
        return Order.objects.create(
            full_name="Test User",
            email="test@example.com",
            phone="1234567890",
            order_type=Order.OrderType.PICKUP,
            status=Order.Status.PENDING,
        )

    def test_payment_intent_succeeded_updates_order(self):
        order = self._create_order()
        event_payload = {
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": "pi_123",
                    "amount": 12345,
                    "currency": "cad",
                    "status": "succeeded",
                    "metadata": {"order_id": order.id},
                }
            },
        }

        with patch("payments.webhooks.STRIPE_WEBHOOK_SECRET", "whsec_test"), patch(
            "payments.webhooks.stripe.Webhook.construct_event", return_value=event_payload
        ), patch("payments.webhooks.record_stripe_payment_from_intent") as mock_record, patch(
            "payments.webhooks.send_order_receipt_email_once"
        ) as mock_send_email:
            response = self.client.post(
                reverse("stripe-webhook"),
                data=event_payload,
                format="json",
                HTTP_STRIPE_SIGNATURE="dummy",
            )

        self.assertEqual(response.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.PAID)
        self.assertEqual(order.stripe_payment_intent_id, "pi_123")

        mock_record.assert_called_once()
        called_order, intent_dict = mock_record.call_args[0]
        self.assertEqual(called_order, order)
        self.assertEqual(intent_dict["id"], "pi_123")
        self.assertEqual(intent_dict["amount"], 12345)
        self.assertEqual(intent_dict["currency"], "cad")
        self.assertEqual(intent_dict["status"], "succeeded")

        mock_send_email.assert_called_once_with(order)

    def test_missing_order_id_no_updates(self):
        order = self._create_order()
        event_payload = {
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": "pi_123",
                    "amount": 12345,
                    "currency": "cad",
                    "status": "succeeded",
                    "metadata": {},
                }
            },
        }

        with patch("payments.webhooks.STRIPE_WEBHOOK_SECRET", "whsec_test"), patch(
            "payments.webhooks.stripe.Webhook.construct_event", return_value=event_payload
        ), patch("payments.webhooks.record_stripe_payment_from_intent") as mock_record, patch(
            "payments.webhooks.send_order_receipt_email_once"
        ) as mock_send_email:
            response = self.client.post(
                reverse("stripe-webhook"),
                data=event_payload,
                format="json",
                HTTP_STRIPE_SIGNATURE="dummy",
            )

        self.assertEqual(response.status_code, 200)
        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.PENDING)
        self.assertEqual(order.stripe_payment_intent_id, "")
        mock_record.assert_not_called()
        mock_send_email.assert_not_called()
