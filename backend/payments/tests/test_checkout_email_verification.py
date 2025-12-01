from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import CustomerProfile
from orders.models import Order
from products.models import Product

User = get_user_model()


class CheckoutEmailVerificationTests(APITestCase):
    def setUp(self):
        self.url = reverse("payments-checkout")
        self.product = Product.objects.create(
            name="Whole Milk",
            slug="whole-milk",
            description="",
            price_cents=500,
            main_image_url="",
            category="dairy",
        )
        self.user = User.objects.create_user(
            username="buyer@example.com",
            email="buyer@example.com",
            password="password123",
        )
        self.profile = CustomerProfile.objects.get(user=self.user)

    def _payload(self):
        return {
            "items": [{"product_id": self.product.id, "quantity": 2}],
            "full_name": "Buyer User",
            "email": "checkout@example.com",
            "phone": "555-1234",
            "order_type": "delivery",
            "address": {
                "line1": "123 Main St",
                "city": "Vancouver",
                "postal_code": "V1V1V1",
                "notes": "Ring the bell",
            },
            "notes": "Leave at door",
        }

    def test_anonymous_checkout_blocked(self):
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_unverified_user_cannot_checkout(self):
        self.client.login(username=self.user.username, password="password123")
        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.json()["detail"], "Please verify your email before checking out.")

    @patch("payments.api.create_payment_intent")
    def test_verified_user_can_checkout_and_order_linked(self, mock_create_intent):
        mock_create_intent.return_value = {
            "id": "pi_verified",
            "client_secret": "cs_verified",
        }
        self.profile.email_verified_at = timezone.now()
        self.profile.save(update_fields=["email_verified_at"])
        self.client.login(username=self.user.username, password="password123")

        response = self.client.post(self.url, self._payload(), format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        data = response.json()
        order = Order.objects.get(id=data["order_id"])
        self.assertEqual(order.user, self.user)
        self.assertEqual(order.email, self.user.email)
        self.assertEqual(order.stripe_payment_intent_id, mock_create_intent.return_value["id"])

        mock_create_intent.assert_called_once()
        called_kwargs = mock_create_intent.call_args.kwargs
        self.assertEqual(called_kwargs["receipt_email"], order.email)
