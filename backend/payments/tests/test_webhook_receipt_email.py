from unittest.mock import patch

from django.core import mail
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework.test import APIClient

from notifications.models import EmailNotification
from orders.models import Order, OrderItem
from payments.models import Payment
from products.models import Product


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="no-reply@example.com",
)
class StripeWebhookReceiptEmailTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.product = Product.objects.create(
            name="Sirloin",
            slug="sirloin-steak",
            description="",
            price_cents=2500,
            main_image_url="",
            category="",
        )
        self.order = Order.objects.create(
            full_name="Jane Doe",
            email="jane@example.com",
            phone="5551234567",
            address_line1="1 Webhook Way",
            address_line2="",
            city="Webhook City",
            postal_code="99999",
            order_type=Order.OrderType.DELIVERY,
            subtotal_cents=2500,
            tax_cents=250,
            total_cents=2750,
            delivery_notes="Ring bell",
        )
        OrderItem.objects.create(
            order=self.order,
            product=self.product,
            product_name=self.product.name,
            quantity=1,
            unit_price_cents=self.product.price_cents,
            total_cents=self.product.price_cents,
        )

    def test_payment_intent_succeeded_records_payment_and_enqueues_receipt_email(self):
        payload = {
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": "pi_test_123",
                    "amount": self.order.total_cents,
                    "currency": "cad",
                    "status": "succeeded",
                    "metadata": {"order_id": str(self.order.id)},
                }
            },
        }
        with patch("payments.webhooks.send_order_receipt_email_task") as mock_task:
            response = self.client.post(
                reverse("stripe-webhook"), payload, format="json"
            )

        self.assertEqual(response.status_code, 200)
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, Order.Status.PAID)
        self.assertEqual(
            self.order.stripe_payment_intent_id, payload["data"]["object"]["id"]
        )

        payment = Payment.objects.get(
            stripe_payment_intent_id=payload["data"]["object"]["id"]
        )
        self.assertEqual(payment.order_id, self.order.id)
        self.assertEqual(payment.amount_cents, payload["data"]["object"]["amount"])
        self.assertEqual(payment.currency, payload["data"]["object"]["currency"])
        self.assertEqual(payment.status, payload["data"]["object"]["status"])

        mock_task.delay.assert_called_once_with(self.order.id)

        self.assertEqual(
            EmailNotification.objects.filter(order=self.order, kind="order_receipt").count(),
            0,
        )
        self.assertEqual(len(mail.outbox), 0)
