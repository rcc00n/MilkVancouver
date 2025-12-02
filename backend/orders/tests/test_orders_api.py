from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import CustomerProfile
from orders.models import Order, Region
from products.models import Product


class OrderAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()
        User = get_user_model()
        self.user = User.objects.create_user(
            username="buyer@example.com",
            email="buyer@example.com",
            password="password123",
        )
        self.profile = CustomerProfile.objects.get(user=self.user)
        self.region = Region.objects.first() or Region.objects.create(
            code="test-north",
            name="North",
            delivery_weekday=1,
            min_orders=0,
        )
        self.product = Product.objects.create(
            name="Whole Milk",
            slug="whole-milk",
            description="",
            price_cents=500,
            category="dairy",
        )
        self.client.force_authenticate(user=self.user)

    def _delivery_payload(self, **overrides):
        payload = {
            "items": [{"product_id": self.product.id, "quantity": 1}],
            "full_name": "Buyer Name",
            "email": "buyer@example.com",
            "phone": "555-0000",
            "order_type": Order.OrderType.DELIVERY,
            "address": {
                "line1": "123 Main St",
                "city": "Vancouver",
                "postal_code": "V1V1V1",
            },
            "region_code": self.region.code,
        }
        payload.update(overrides)
        return payload

    def test_unverified_email_cannot_create_order(self):
        self.profile.email_verified_at = None
        self.profile.phone_verified_at = timezone.now()
        self.profile.save(update_fields=["email_verified_at", "phone_verified_at"])

        response = self.client.post(reverse("order-list"), self._delivery_payload(), format="json")

        self.assertEqual(response.status_code, 400)
        detail = response.json().get("detail", "").lower()
        self.assertIn("email", detail)
        self.assertIn("verify", detail)
        self.assertEqual(Order.objects.count(), 0)

    def test_delivery_requires_verified_phone(self):
        self.profile.email_verified_at = timezone.now()
        self.profile.phone_verified_at = None
        self.profile.save(update_fields=["email_verified_at", "phone_verified_at"])

        response = self.client.post(reverse("order-list"), self._delivery_payload(), format="json")

        self.assertEqual(response.status_code, 400)
        detail = response.json().get("detail", "").lower()
        self.assertIn("phone", detail)
        self.assertIn("verify", detail)
        self.assertEqual(Order.objects.count(), 0)

    def test_successful_order_creation_computes_totals_and_sets_region(self):
        now = timezone.now()
        self.profile.email_verified_at = now
        self.profile.phone_verified_at = now
        self.profile.save(update_fields=["email_verified_at", "phone_verified_at"])

        second_product = Product.objects.create(
            name="Skim Milk",
            slug="skim-milk",
            description="",
            price_cents=350,
            category="dairy",
        )
        payload = self._delivery_payload(
            items=[
                {"product_id": self.product.id, "quantity": 2},
                {"product_id": second_product.id, "quantity": 1},
            ]
        )

        response = self.client.post(reverse("order-list"), payload, format="json")

        self.assertEqual(response.status_code, 201)
        data = response.json()
        order = Order.objects.get(id=data["id"])

        expected_subtotal = (2 * self.product.price_cents) + second_product.price_cents
        self.assertEqual(order.subtotal_cents, expected_subtotal)
        self.assertEqual(order.tax_cents, 0)
        self.assertEqual(order.total_cents, expected_subtotal)
        self.assertEqual(order.region, self.region)
        self.assertEqual(order.user, self.user)
        self.assertEqual(order.items.count(), 2)
        self.assertEqual(len(data.get("items", [])), 2)
        self.assertEqual(data.get("region"), self.region.code)
