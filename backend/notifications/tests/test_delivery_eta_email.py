import datetime

from django.core import mail
from django.test import TestCase, override_settings
from django.utils import timezone

from notifications.emails import DELIVERY_ETA_KIND, send_delivery_eta_email
from notifications.models import EmailNotification
from notifications.tasks import send_delivery_eta_email_task
from orders.models import Order


@override_settings(
    EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend",
    DEFAULT_FROM_EMAIL="no-reply@example.com",
)
class DeliveryEtaEmailTests(TestCase):
    def setUp(self):
        self.order = Order.objects.create(
            full_name="Test User",
            email="test@example.com",
            phone="+15550000000",
            address_line1="123 Main St",
            city="Townsville",
            postal_code="12345",
            order_type=Order.OrderType.DELIVERY,
            status=Order.Status.PAID,
        )

    def test_send_delivery_eta_email_sends_and_records_notification(self):
        eta = timezone.now() + datetime.timedelta(days=1)
        self.order.estimated_delivery_at = eta
        self.order.save(update_fields=["estimated_delivery_at"])

        notification = send_delivery_eta_email(self.order)

        self.assertEqual(notification.kind, DELIVERY_ETA_KIND)
        self.assertEqual(notification.order_id, self.order.id)
        self.assertEqual(notification.to_email, self.order.email)
        self.assertEqual(notification.status, EmailNotification.STATUS_SENT)
        self.assertEqual(EmailNotification.objects.count(), 1)
        self.assertEqual(len(mail.outbox), 1)
        message = mail.outbox[0]
        self.assertIn(str(self.order.id), message.subject)
        formatted_eta = timezone.localtime(eta).strftime("%Y-%m-%d around %H:%M")
        self.assertIn(formatted_eta, notification.body_text)
        self.assertIn(formatted_eta, notification.body_html)

    def test_send_delivery_eta_email_handles_missing_email(self):
        order_without_email = Order.objects.create(
            full_name="No Email",
            email="",
            phone="+15550000000",
            address_line1="123 Main St",
            city="Townsville",
            postal_code="12345",
            order_type=Order.OrderType.DELIVERY,
            status=Order.Status.PAID,
        )

        notification = send_delivery_eta_email(order_without_email)

        self.assertEqual(notification.status, EmailNotification.STATUS_FAILED)
        self.assertEqual(notification.to_email, "")
        self.assertIn("no email address", notification.error.lower())
        self.assertEqual(len(mail.outbox), 0)

    def test_send_delivery_eta_email_task_wrapper(self):
        self.order.estimated_delivery_at = timezone.now() + datetime.timedelta(hours=5)
        self.order.save(update_fields=["estimated_delivery_at"])

        notif_id = send_delivery_eta_email_task(self.order.id)
        self.assertIsNotNone(notif_id)
        self.assertTrue(EmailNotification.objects.filter(id=notif_id).exists())

        missing = send_delivery_eta_email_task(999999)
        self.assertIsNone(missing)
