from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import CustomerProfile
from orders.models import Order, OrderItem
from products.models import Product

User = get_user_model()


class CreateCheckoutTests(APITestCase):
    def setUp(self):
        self.product = Product.objects.create(
            name="Whole Milk",
            slug="whole-milk",
            description="",
            price_cents=500,
            main_image_url="",
            category="dairy",
        )
        self.user = User.objects.create_user(
            username="john@example.com",
            email="john@example.com",
            password="password123",
        )
        self.profile = CustomerProfile.objects.get(user=self.user)
        self.profile.email_verified_at = timezone.now()
        self.profile.phone_verified_at = timezone.now()
        self.profile.save(update_fields=["email_verified_at", "phone_verified_at"])
        self.client.login(username=self.user.username, password="password123")

    def _base_payload(self):
        return {
            "items": [{"product_id": self.product.id, "quantity": 2}],
            "full_name": "John Doe",
            "email": "john@example.com",
            "phone": "555-0000",
            "order_type": "delivery",
            "address": {
                "line1": "123 Main St",
                "city": "Vancouver",
                "postal_code": "V1V1V1",
                "notes": "Ring the bell",
            },
            "notes": "Leave at door",
        }

    @patch("payments.api.create_payment_intent")
    def test_creates_order_items_and_intent(self, mock_create_intent):
        mock_create_intent.return_value = {
            "id": "pi_test_checkout",
            "client_secret": "cs_test_checkout",
        }

        url = reverse("payments-checkout")
        payload = self._base_payload()
        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.json()
        self.assertEqual(data["client_secret"], "cs_test_checkout")
        self.assertEqual(data["currency"], "cad")

        order = Order.objects.get(id=data["order_id"])
        self.assertEqual(order.full_name, payload["full_name"])
        self.assertEqual(order.email, payload["email"])
        self.assertEqual(order.phone, payload["phone"])
        self.assertEqual(order.address_line1, payload["address"]["line1"])
        self.assertEqual(order.city, payload["address"]["city"])
        self.assertEqual(order.postal_code, payload["address"]["postal_code"])
        self.assertEqual(order.notes, payload["notes"])
        self.assertEqual(order.status, Order.Status.PENDING)

        expected_subtotal = self.product.price_cents * 2
        expected_tax = int(round(expected_subtotal * 0.05))
        expected_total = expected_subtotal + expected_tax

        self.assertEqual(order.subtotal_cents, expected_subtotal)
        self.assertEqual(order.tax_cents, expected_tax)
        self.assertEqual(order.total_cents, expected_total)
        self.assertEqual(order.stripe_payment_intent_id, "pi_test_checkout")

        items = OrderItem.objects.filter(order=order)
        self.assertEqual(items.count(), 1)
        item = items.first()
        self.assertEqual(item.product, self.product)
        self.assertEqual(item.quantity, 2)
        self.assertEqual(item.unit_price_cents, self.product.price_cents)
        self.assertEqual(item.total_cents, self.product.price_cents * 2)

        mock_create_intent.assert_called_once()
        called_kwargs = mock_create_intent.call_args.kwargs
        self.assertEqual(called_kwargs["amount_cents"], expected_total)
        self.assertEqual(called_kwargs["currency"], "cad")
        self.assertEqual(called_kwargs["receipt_email"], order.email)
        self.assertEqual(called_kwargs["metadata"]["order_id"], str(order.id))

    def test_validation_error_when_no_items(self):
        url = reverse("payments-checkout")
        payload = self._base_payload()
        payload["items"] = []

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("items", response.json())
        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(OrderItem.objects.count(), 0)

    def test_validation_error_unknown_product(self):
        url = reverse("payments-checkout")
        payload = self._base_payload()
        payload["items"] = [{"product_id": 9999, "quantity": 1}]

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(OrderItem.objects.count(), 0)

    def test_validation_error_missing_address_for_delivery(self):
        url = reverse("payments-checkout")
        payload = self._base_payload()
        payload["address"] = {"city": "Vancouver", "postal_code": "V1V1V1"}

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("address", response.json())
        self.assertEqual(Order.objects.count(), 0)
        self.assertEqual(OrderItem.objects.count(), 0)

    @patch("payments.api.create_payment_intent")
    def test_pickup_order_without_address(self, mock_create_intent):
        mock_create_intent.return_value = {
            "id": "pi_pickup",
            "client_secret": "cs_pickup",
        }
        url = reverse("payments-checkout")
        payload = self._base_payload()
        payload["order_type"] = "pickup"
        payload["pickup_location"] = "Storefront"
        payload["address"] = {}

        response = self.client.post(url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        order = Order.objects.get(id=response.json()["order_id"])
        self.assertEqual(order.order_type, Order.OrderType.PICKUP)
        self.assertEqual(order.pickup_location, "Storefront")
        self.assertEqual(order.address_line1, "")

        mock_create_intent.assert_called_once()
