from django.test import TestCase

from orders.models import Order
from payments.models import Payment
from payments.services import record_stripe_payment_from_intent


class RecordStripePaymentFromIntentTests(TestCase):
    def setUp(self):
        self.order = Order.objects.create(
            full_name="Test User",
            email="test@example.com",
            phone="1234567890",
            order_type=Order.OrderType.PICKUP,
            status=Order.Status.PENDING,
            subtotal_cents=1000,
            tax_cents=50,
            total_cents=1050,
        )

    def test_creates_new_payment_if_missing(self):
        intent = {
            "id": "pi_test_new",
            "amount": 1050,
            "currency": "cad",
            "status": "succeeded",
            "charges": {"data": [{"id": "ch_test_1"}]},
        }

        payment = record_stripe_payment_from_intent(self.order, intent)

        self.assertEqual(Payment.objects.count(), 1)
        self.assertEqual(payment.order, self.order)
        self.assertEqual(payment.provider, Payment.Provider.STRIPE)
        self.assertEqual(payment.kind, Payment.Kind.CHARGE)
        self.assertEqual(payment.amount_cents, 1050)
        self.assertEqual(payment.currency, "cad")
        self.assertEqual(payment.status, "succeeded")
        self.assertEqual(payment.stripe_payment_intent_id, "pi_test_new")
        self.assertEqual(payment.stripe_charge_id, "ch_test_1")
        self.assertEqual(payment.raw_payload["id"], "pi_test_new")

    def test_updates_existing_payment_with_same_intent(self):
        existing = Payment.objects.create(
            order=self.order,
            provider=Payment.Provider.STRIPE,
            kind=Payment.Kind.CHARGE,
            amount_cents=500,
            currency="cad",
            status="processing",
            stripe_payment_intent_id="pi_same",
            stripe_charge_id="",
            raw_payload={"original": True},
        )

        intent = {
            "id": "pi_same",
            "amount": 2000,
            "currency": "cad",
            "status": "succeeded",
            "charges": {"data": [{"id": "ch_updated"}]},
        }

        payment = record_stripe_payment_from_intent(self.order, intent)

        self.assertEqual(Payment.objects.count(), 1)
        existing.refresh_from_db()
        self.assertEqual(payment.id, existing.id)
        self.assertEqual(existing.amount_cents, 2000)
        self.assertEqual(existing.status, "succeeded")
        self.assertEqual(existing.stripe_charge_id, "ch_updated")
        self.assertEqual(existing.raw_payload["id"], "pi_same")

    def test_handles_missing_charges(self):
        intent = {
            "id": "pi_no_charge",
            "amount": 1500,
            "currency": "cad",
            "status": "processing",
            "charges": {"data": []},
        }

        payment = record_stripe_payment_from_intent(self.order, intent)

        self.assertEqual(payment.stripe_charge_id, "")
        self.assertEqual(payment.amount_cents, 1500)
        self.assertEqual(payment.status, "processing")
