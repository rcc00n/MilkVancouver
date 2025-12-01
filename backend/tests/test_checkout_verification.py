import uuid

import pytest
from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import CustomerProfile
from orders.models import Order, Region
from products.models import Product

pytestmark = pytest.mark.django_db


@pytest.fixture
def user_and_client():
    user_model = get_user_model()
    email = f"buyer-{uuid.uuid4().hex[:8]}@example.com"
    user = user_model.objects.create_user(username=email, email=email, password="password123")
    CustomerProfile.objects.get_or_create(user=user)
    client = APIClient()
    client.force_authenticate(user=user)
    return user, client


@pytest.fixture
def product():
    return Product.objects.create(
        name="Test Milk",
        slug=f"milk-{uuid.uuid4().hex[:8]}",
        description="",
        price_cents=500,
        main_image_url="https://example.com/milk.jpg",
        category="dairy",
        is_active=True,
    )


@pytest.fixture
def build_payload():
    def _builder(product, order_type=Order.OrderType.PICKUP):
        region = Region.objects.first() or Region.objects.create(
            code="north", name="North", delivery_weekday=1, min_orders=5
        )
        payload = {
            "items": [{"product_id": product.id, "quantity": 1}],
            "full_name": "Test Buyer",
            "email": "buyer@example.com",
            "phone": "555-0000",
            "order_type": order_type,
            "pickup_location": "Front Desk",
            "pickup_instructions": "",
            "notes": "",
        }
        if order_type == Order.OrderType.DELIVERY:
            payload["address"] = {
                "line1": "123 Main St",
                "city": "Vancouver",
                "postal_code": "V1V1V1",
            }
            payload["region_code"] = region.code
        else:
            payload["address"] = {}
        return payload

    return _builder


@pytest.fixture(autouse=True)
def cleanup_orders():
    yield
    Order.objects.all().delete()


def test_checkout_blocks_unverified_email(user_and_client, product, build_payload, monkeypatch):
    user, client = user_and_client
    profile = CustomerProfile.objects.get(user=user)
    profile.email_verified_at = None
    profile.phone_verified_at = timezone.now()
    profile.save(update_fields=["email_verified_at", "phone_verified_at"])

    called = False

    def fake_create_payment_intent(**kwargs):
        nonlocal called
        called = True
        return {"id": "pi_fake", "client_secret": "cs_fake"}

    monkeypatch.setattr("payments.api.create_payment_intent", fake_create_payment_intent)

    response = client.post(reverse("payments-checkout"), build_payload(product), format="json")

    assert response.status_code == 400
    assert response.json()["detail"] == "Please verify your email before placing an order."
    assert called is False
    assert Order.objects.filter(user=user).count() == 0


def test_checkout_blocks_unverified_phone_for_delivery_but_allows_pickup(
    user_and_client, product, build_payload, monkeypatch
):
    user, client = user_and_client
    profile = CustomerProfile.objects.get(user=user)
    profile.email_verified_at = timezone.now()
    profile.phone_verified_at = None
    profile.save(update_fields=["email_verified_at", "phone_verified_at"])

    called = False

    def fake_create_payment_intent(**kwargs):
        nonlocal called
        called = True
        return {"id": "pi_fake", "client_secret": "cs_fake"}

    monkeypatch.setattr("payments.api.create_payment_intent", fake_create_payment_intent)

    delivery_payload = build_payload(product, order_type=Order.OrderType.DELIVERY)
    delivery_response = client.post(reverse("payments-checkout"), delivery_payload, format="json")

    assert delivery_response.status_code == 400
    assert delivery_response.json()["detail"] == "Verify phone to place a delivery order."
    assert called is False
    assert Order.objects.filter(user=user).count() == 0

    pickup_response = client.post(reverse("payments-checkout"), build_payload(product), format="json")

    assert pickup_response.status_code == 201
    assert called is True
    assert Order.objects.filter(user=user).count() == 1


def test_checkout_succeeds_when_verified_and_creates_payment_intent(
    user_and_client, product, build_payload, monkeypatch
):
    user, client = user_and_client
    profile = CustomerProfile.objects.get(user=user)
    now = timezone.now()
    profile.email_verified_at = now
    profile.phone_verified_at = now
    profile.phone = "555-1111"
    profile.save(update_fields=["email_verified_at", "phone_verified_at", "phone"])

    captured_kwargs = {}

    def fake_create_payment_intent(**kwargs):
        captured_kwargs.update(kwargs)
        return {"id": "pi_test_123", "client_secret": "cs_test_123"}

    monkeypatch.setattr("payments.api.create_payment_intent", fake_create_payment_intent)

    payload = build_payload(product, order_type=Order.OrderType.DELIVERY)
    response = client.post(reverse("payments-checkout"), payload, format="json")

    assert response.status_code == 201
    body = response.json()
    assert body["client_secret"] == "cs_test_123"
    assert body["currency"] == "cad"

    order_id = body["order_id"]
    order = Order.objects.get(id=order_id)
    subtotal = product.price_cents
    expected_tax = int(round(subtotal * 0.05))
    expected_total = subtotal + expected_tax

    assert body["amount"] == expected_total
    assert order.user == user
    assert order.subtotal_cents == subtotal
    assert order.tax_cents == expected_tax
    assert order.total_cents == expected_total
    assert order.stripe_payment_intent_id == "pi_test_123"

    assert captured_kwargs["amount_cents"] == expected_total
    assert captured_kwargs["currency"] == "cad"
    assert captured_kwargs["receipt_email"] == order.email
    assert captured_kwargs["metadata"]["order_id"] == str(order.id)


@override_settings(ROOT_URLCONF="tests.urlconf")
def test_legacy_create_checkout_blocks_unverified_email(
    user_and_client, product, build_payload, monkeypatch
):
    user, client = user_and_client
    profile = CustomerProfile.objects.get(user=user)
    profile.email_verified_at = None
    profile.phone_verified_at = timezone.now()
    profile.save(update_fields=["email_verified_at", "phone_verified_at"])

    called = False

    def fake_pi_create(**kwargs):
        nonlocal called
        called = True
        return {"id": "pi_fake", "client_secret": "cs_fake"}

    monkeypatch.setattr("payments.stripe_api.stripe.PaymentIntent.create", fake_pi_create)

    url = reverse("payments-create-checkout")
    response = client.post(url, build_payload(product), format="json")

    assert response.status_code == 400
    assert response.json()["detail"] == "Please verify your email before placing an order."
    assert called is False
    assert Order.objects.filter(user=user).count() == 0


@override_settings(ROOT_URLCONF="tests.urlconf")
def test_legacy_create_checkout_blocks_unverified_phone_for_delivery(
    user_and_client, product, build_payload, monkeypatch
):
    user, client = user_and_client
    profile = CustomerProfile.objects.get(user=user)
    profile.email_verified_at = timezone.now()
    profile.phone_verified_at = None
    profile.save(update_fields=["email_verified_at", "phone_verified_at"])

    called = False

    def fake_pi_create(**kwargs):
        nonlocal called
        called = True
        return {"id": "pi_fake", "client_secret": "cs_fake"}

    monkeypatch.setattr("payments.stripe_api.stripe.PaymentIntent.create", fake_pi_create)

    url = reverse("payments-create-checkout")
    response = client.post(
        url, build_payload(product, order_type=Order.OrderType.DELIVERY), format="json"
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Verify phone to place a delivery order."
    assert called is False
    assert Order.objects.filter(user=user).count() == 0


@override_settings(ROOT_URLCONF="tests.urlconf")
def test_legacy_create_checkout_succeeds_when_verified(
    user_and_client, product, build_payload, monkeypatch
):
    user, client = user_and_client
    profile = CustomerProfile.objects.get(user=user)
    now = timezone.now()
    profile.email_verified_at = now
    profile.phone_verified_at = now
    profile.phone = "555-9999"
    profile.save(update_fields=["email_verified_at", "phone_verified_at", "phone"])

    captured_kwargs = {}

    def fake_pi_create(**kwargs):
        captured_kwargs.update(kwargs)
        return {"id": "pi_legacy_123", "client_secret": "cs_legacy_123"}

    monkeypatch.setattr("payments.stripe_api.stripe.PaymentIntent.create", fake_pi_create)

    url = reverse("payments-create-checkout")
    response = client.post(url, build_payload(product, order_type=Order.OrderType.DELIVERY), format="json")

    assert response.status_code == 201
    body = response.json()
    order = Order.objects.get(id=body["order_id"])

    subtotal = product.price_cents
    expected_tax = int(subtotal * 0.05)
    expected_total = subtotal + expected_tax

    assert body["client_secret"] == "cs_legacy_123"
    assert body["amount"] == expected_total
    assert order.user == user
    assert order.total_cents == expected_total
    assert order.stripe_payment_intent_id == "pi_legacy_123"

    assert captured_kwargs["amount"] == expected_total
    assert captured_kwargs["currency"] == "cad"
    assert captured_kwargs["receipt_email"] == order.email
    assert captured_kwargs["metadata"]["order_id"] == str(order.id)
