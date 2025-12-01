from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import CustomerProfile
from orders.models import Order
from products.models import Product

User = get_user_model()


@override_settings(ROOT_URLCONF="tests.urlconf")
class OrderCreationVerificationTests(APITestCase):
    def setUp(self):
        self.checkout_url = reverse("payments-checkout")
        self.legacy_checkout_url = reverse("payments-create-checkout")
        self.order_list_url = reverse("order-list")
        self.product = Product.objects.create(
            name="Whole Milk",
            slug="whole-milk",
            description="",
            price_cents=500,
            main_image_url="",
            category="dairy",
        )

    def _create_user(
        self,
        *,
        email="user@example.com",
        is_staff=False,
        email_verified=False,
        phone_verified=False,
        first_name="",
        last_name="",
        phone="",
    ):
        user = User.objects.create_user(
            username=email,
            email=email,
            password="password123",
            first_name=first_name,
            last_name=last_name,
        )
        profile: CustomerProfile = CustomerProfile.objects.get(user=user)
        profile.phone = phone or profile.phone
        if email_verified:
            profile.email_verified_at = timezone.now()
        if phone_verified:
            profile.phone_verified_at = timezone.now()
        profile.save()
        if is_staff:
            user.is_staff = True
            user.save(update_fields=["is_staff"])
        return user, profile

    def _delivery_payload(self, include_contact=True):
        payload = {
            "items": [{"product_id": self.product.id, "quantity": 1}],
            "order_type": Order.OrderType.DELIVERY,
            "address": {
                "line1": "123 Main St",
                "city": "Vancouver",
                "postal_code": "V1V1V1",
            },
        }
        if include_contact:
            payload.update(
                {"full_name": "Delivery User", "email": "delivery@example.com", "phone": "555-0001"}
            )
        return payload

    def _pickup_payload(self, include_contact=True):
        payload = {
            "items": [{"product_id": self.product.id, "quantity": 1}],
            "order_type": Order.OrderType.PICKUP,
            "pickup_location": "Storefront",
        }
        if include_contact:
            payload.update(
                {"full_name": "Pickup User", "email": "pickup@example.com", "phone": "555-0002"}
            )
        return payload

    def test_email_unverified_blocks_all_endpoints(self):
        user, _ = self._create_user(email="unverified@example.com", phone_verified=True)
        self.client.login(username=user.username, password="password123")

        for url in (self.checkout_url, self.legacy_checkout_url, self.order_list_url):
            response = self.client.post(url, self._delivery_payload(), format="json")
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(
                response.json()["detail"], "Please verify your email before placing an order."
            )

        self.assertEqual(Order.objects.count(), 0)

    def test_delivery_requires_verified_phone_but_pickup_allowed(self):
        user, _ = self._create_user(
            email="phonecheck@example.com", email_verified=True, phone_verified=False
        )
        self.client.login(username=user.username, password="password123")

        for url in (self.checkout_url, self.legacy_checkout_url, self.order_list_url):
            response = self.client.post(url, self._delivery_payload(), format="json")
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(response.json()["detail"], "Verify phone to place a delivery order.")

        self.assertEqual(Order.objects.count(), 0)

        with patch("payments.api.create_payment_intent") as mock_create_intent, patch(
            "payments.stripe_api.stripe.PaymentIntent.create"
        ) as mock_payment_intent:
            mock_create_intent.return_value = {"id": "pi_checkout", "client_secret": "cs_checkout"}
            mock_payment_intent.return_value = {
                "id": "pi_legacy",
                "client_secret": "cs_legacy",
            }

            checkout_response = self.client.post(
                self.checkout_url, self._pickup_payload(), format="json"
            )
            self.assertEqual(checkout_response.status_code, status.HTTP_201_CREATED)
            checkout_order = Order.objects.get(id=checkout_response.json()["order_id"])
            self.assertEqual(checkout_order.order_type, Order.OrderType.PICKUP)
            self.assertEqual(checkout_order.user, user)

            legacy_response = self.client.post(
                self.legacy_checkout_url, self._pickup_payload(), format="json"
            )
            self.assertEqual(legacy_response.status_code, status.HTTP_201_CREATED)
            legacy_order = Order.objects.get(id=legacy_response.json()["order_id"])
            self.assertEqual(legacy_order.order_type, Order.OrderType.PICKUP)
            self.assertEqual(legacy_order.user, user)

        order_response = self.client.post(self.order_list_url, self._pickup_payload(), format="json")
        self.assertEqual(order_response.status_code, status.HTTP_201_CREATED)
        order = Order.objects.get(id=order_response.data["id"])
        self.assertEqual(order.order_type, Order.OrderType.PICKUP)
        self.assertEqual(order.user, user)

    def test_staff_allow_unverified_bypasses_checks(self):
        user, _ = self._create_user(
            email="staff@example.com",
            is_staff=True,
            email_verified=False,
            phone_verified=False,
        )
        self.client.login(username=user.username, password="password123")
        payload = self._delivery_payload()
        payload["allow_unverified"] = True

        with patch("payments.api.create_payment_intent") as mock_create_intent, patch(
            "payments.stripe_api.stripe.PaymentIntent.create"
        ) as mock_payment_intent:
            mock_create_intent.return_value = {"id": "pi_checkout", "client_secret": "cs_checkout"}
            mock_payment_intent.return_value = {
                "id": "pi_legacy",
                "client_secret": "cs_legacy",
            }

            checkout_response = self.client.post(self.checkout_url, payload, format="json")
            self.assertEqual(checkout_response.status_code, status.HTTP_201_CREATED)
            checkout_order = Order.objects.get(id=checkout_response.json()["order_id"])
            self.assertEqual(checkout_order.user, user)

            legacy_response = self.client.post(self.legacy_checkout_url, payload, format="json")
            self.assertEqual(legacy_response.status_code, status.HTTP_201_CREATED)
            legacy_order = Order.objects.get(id=legacy_response.json()["order_id"])
            self.assertEqual(legacy_order.user, user)

        order_response = self.client.post(self.order_list_url, payload, format="json")
        self.assertEqual(order_response.status_code, status.HTTP_201_CREATED)
        order = Order.objects.get(id=order_response.data["id"])
        self.assertEqual(order.user, user)

    def test_allow_unverified_ignored_for_non_staff(self):
        user, _ = self._create_user(
            email="normal@example.com",
            email_verified=False,
            phone_verified=False,
        )
        self.client.login(username=user.username, password="password123")
        payload = self._delivery_payload()
        payload["allow_unverified"] = True

        for url in (self.checkout_url, self.legacy_checkout_url, self.order_list_url):
            response = self.client.post(url, payload, format="json")
            self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
            self.assertEqual(
                response.json()["detail"], "Please verify your email before placing an order."
            )
        self.assertEqual(Order.objects.count(), 0)

    def test_contact_defaults_populated_from_profile_and_user(self):
        user, profile = self._create_user(
            email="defaulting@example.com",
            email_verified=True,
            phone_verified=True,
            first_name="First",
            last_name="Last",
            phone="555-2222",
        )
        self.client.login(username=user.username, password="password123")

        with patch("payments.api.create_payment_intent") as mock_create_intent, patch(
            "payments.stripe_api.stripe.PaymentIntent.create"
        ) as mock_payment_intent:
            mock_create_intent.return_value = {"id": "pi_checkout", "client_secret": "cs_checkout"}
            mock_payment_intent.return_value = {
                "id": "pi_legacy",
                "client_secret": "cs_legacy",
            }

            checkout_response = self.client.post(
                self.checkout_url, self._pickup_payload(include_contact=False), format="json"
            )
            self.assertEqual(checkout_response.status_code, status.HTTP_201_CREATED)
            checkout_order = Order.objects.get(id=checkout_response.json()["order_id"])
            self.assertEqual(checkout_order.full_name, f"{profile.first_name} {profile.last_name}")
            self.assertEqual(checkout_order.email, user.email)
            self.assertEqual(checkout_order.phone, profile.phone)
            self.assertEqual(checkout_order.user, user)

            legacy_response = self.client.post(
                self.legacy_checkout_url, self._pickup_payload(include_contact=False), format="json"
            )
            self.assertEqual(legacy_response.status_code, status.HTTP_201_CREATED)
            legacy_order = Order.objects.get(id=legacy_response.json()["order_id"])
            self.assertEqual(legacy_order.full_name, f"{profile.first_name} {profile.last_name}")
            self.assertEqual(legacy_order.email, user.email)
            self.assertEqual(legacy_order.phone, profile.phone)
            self.assertEqual(legacy_order.user, user)

        order_response = self.client.post(
            self.order_list_url, self._pickup_payload(include_contact=False), format="json"
        )
        self.assertEqual(order_response.status_code, status.HTTP_201_CREATED)
        order = Order.objects.get(id=order_response.data["id"])
        self.assertEqual(order.full_name, f"{profile.first_name} {profile.last_name}")
        self.assertEqual(order.email, user.email)
        self.assertEqual(order.phone, profile.phone)
        self.assertEqual(order.user, user)

    def test_guest_users_cannot_create_orders(self):
        for url in (self.checkout_url, self.legacy_checkout_url, self.order_list_url):
            response = self.client.post(url, self._pickup_payload(), format="json")
            self.assertIn(
                response.status_code,
                (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
            )

        self.assertEqual(Order.objects.count(), 0)
