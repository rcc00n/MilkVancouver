import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from django.test import override_settings
from rest_framework import status
from rest_framework.test import APIClient
import uuid

from accounts.models import CustomerProfile
from orders.models import Order, Region
from products.models import Product

User = get_user_model()

pytestmark = pytest.mark.django_db


@pytest.fixture
def user_client():
    user = User.objects.create_user(
        username=f"legacyregion-{uuid.uuid4().hex[:6]}@example.com",
        email="legacyregion@example.com",
        password="password123",
    )
    profile = CustomerProfile.objects.get(user=user)
    profile.email_verified_at = timezone.now()
    profile.phone_verified_at = timezone.now()
    profile.save(update_fields=["email_verified_at", "phone_verified_at"])
    client = APIClient()
    client.force_authenticate(user=user)
    return user, profile, client


@pytest.fixture
def product():
    return Product.objects.create(
        name="Legacy Milk",
        slug=f"legacy-milk-{uuid.uuid4().hex[:6]}",
        price_cents=1200,
    )


@pytest.fixture
def region():
    obj, _ = Region.objects.get_or_create(
        code="west",
        defaults={"name": "West", "delivery_weekday": 2, "min_orders": 4},
    )
    return obj


def base_payload(product, order_type="delivery", region_code=None):
    payload = {
        "items": [{"product_id": product.id, "quantity": 1}],
        "full_name": "Legacy User",
        "email": "legacy@example.com",
        "phone": "555-2222",
        "order_type": order_type,
    }
    if order_type == Order.OrderType.DELIVERY:
        payload["address"] = {"line1": "789 Legacy", "city": "Van", "postal_code": "V2V2V2"}
    if region_code is not None:
        payload["region_code"] = region_code
    return payload


@override_settings(ROOT_URLCONF="tests.urlconf")
def test_delivery_requires_region_code_legacy(user_client, product):
    _user, _profile, client = user_client
    url = reverse("payments-create-checkout")
    response = client.post(url, base_payload(product), format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "region_code" in str(response.data).lower()


@override_settings(ROOT_URLCONF="tests.urlconf")
def test_delivery_invalid_region_code_legacy(user_client, product):
    _user, _profile, client = user_client
    url = reverse("payments-create-checkout")
    response = client.post(url, base_payload(product, region_code="invalid"), format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "region_code" in str(response.data).lower()


@override_settings(ROOT_URLCONF="tests.urlconf")
def test_delivery_valid_region_sets_region_legacy(user_client, product, region, monkeypatch):
    _user, _profile, client = user_client
    url = reverse("payments-create-checkout")
    monkeypatch.setattr(
        "payments.stripe_api.stripe.PaymentIntent.create",
        lambda **kwargs: {"id": "pi_legacy", "client_secret": "cs_legacy"},
    )
    response = client.post(url, base_payload(product, region_code=region.code), format="json")
    assert response.status_code == status.HTTP_201_CREATED
    order = Order.objects.get(id=response.json()["order_id"])
    assert order.region == region


@override_settings(ROOT_URLCONF="tests.urlconf")
def test_pickup_allows_missing_region_legacy(user_client, product, monkeypatch):
    _user, _profile, client = user_client
    url = reverse("payments-create-checkout")
    monkeypatch.setattr(
        "payments.stripe_api.stripe.PaymentIntent.create",
        lambda **kwargs: {"id": "pi_pickup", "client_secret": "cs_pickup"},
    )
    response = client.post(url, base_payload(product, order_type=Order.OrderType.PICKUP), format="json")
    assert response.status_code == status.HTTP_201_CREATED
    order = Order.objects.get(id=response.json()["order_id"])
    assert order.region is None
