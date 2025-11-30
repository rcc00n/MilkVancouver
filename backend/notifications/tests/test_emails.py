from django.core import mail
from django.test import TestCase, override_settings

from notifications.emails import (
    send_order_receipt_email,
    send_order_receipt_email_once,
)
from notifications.models import EmailNotification
from orders.models import Order, OrderItem
from products.models import Product


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="no-reply@example.com",
)
class SendOrderReceiptEmailTests(TestCase):
    def setUp(self):
        self.product = Product.objects.create(
            name="Ribeye Steak",
            slug="ribeye-steak",
            description="Test steak",
            price_cents=2000,
            main_image_url="",
            category="",
        )
        self.order = Order.objects.create(
            full_name="John Doe",
            email="john@example.com",
            phone="1234567890",
            address_line1="123 Main St",
            address_line2="Unit 4",
            city="Townsville",
            postal_code="12345",
            order_type=Order.OrderType.DELIVERY,
            subtotal_cents=4000,
            tax_cents=200,
            total_cents=4200,
            delivery_notes="Leave at door",
        )
        OrderItem.objects.create(
            order=self.order,
            product=self.product,
            product_name=self.product.name,
            quantity=2,
            unit_price_cents=self.product.price_cents,
            total_cents=self.product.price_cents * 2,
        )

    def test_send_order_receipt_email_creates_notification_and_pdf(self):
        notification = send_order_receipt_email(self.order)

        self.assertEqual(EmailNotification.objects.count(), 1)
        self.assertEqual(notification.status, "sent")
        self.assertEqual(notification.to_email, self.order.email)
        self.assertIsNotNone(notification.sent_at)

        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertEqual(message.to, [self.order.email])
        self.assertTrue(message.attachments)

        filename, content, mimetype = message.attachments[0]
        self.assertEqual(filename, f"order-{self.order.id}-receipt.pdf")
        self.assertEqual(mimetype, "application/pdf")
        self.assertTrue(content)

    def test_send_order_receipt_email_once_is_idempotent(self):
        first = send_order_receipt_email_once(self.order)
        second = send_order_receipt_email_once(self.order)

        self.assertEqual(first.id, second.id)
        self.assertEqual(EmailNotification.objects.count(), 1)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(first.status, "sent")
