import pytest
from django.contrib.auth import get_user_model
import uuid
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import CustomerProfile
from orders.models import Order, Region
from products.models import Product

User = get_user_model()

pytestmark = pytest.mark.django_db


@pytest.fixture
def user_client():
    user = User.objects.create_user(
        username=f"regionuser-{uuid.uuid4().hex[:6]}@example.com",
        email="regionuser@example.com",
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
def products():
    return [
        Product.objects.create(
            name="Milk",
            slug=f"milk-region-{uuid.uuid4().hex[:6]}",
            price_cents=1000,
        ),
    ]


@pytest.fixture
def region():
    obj, _ = Region.objects.get_or_create(
        code="north",
        defaults={"name": "North", "delivery_weekday": 1, "min_orders": 5},
    )
    return obj


def _base_payload(product, order_type="delivery", region_code=None):
    payload = {
        "items": [{"product_id": product.id, "quantity": 1}],
        "full_name": "Test Buyer",
        "email": "buyer@example.com",
        "phone": "555-0000",
        "order_type": order_type,
    }
    if order_type == Order.OrderType.DELIVERY:
        payload["address"] = {"line1": "123 Main", "city": "Van", "postal_code": "V1V1V1"}
    else:
        payload["pickup_location"] = "Front Desk"
    if region_code is not None:
        payload["region_code"] = region_code
    return payload


def test_delivery_requires_region_code(user_client, products):
    _user, _profile, client = user_client
    product = products[0]
    url = reverse("payments-checkout")
    response = client.post(url, _base_payload(product, order_type=Order.OrderType.DELIVERY), format="json")
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "region_code" in str(response.data).lower()


def test_delivery_unknown_region_code_rejected(user_client, products):
    _user, _profile, client = user_client
    product = products[0]
    url = reverse("payments-checkout")
    response = client.post(
        url,
        _base_payload(product, order_type=Order.OrderType.DELIVERY, region_code="unknown"),
        format="json",
    )
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "region_code" in str(response.data).lower()


def test_delivery_with_valid_region_attaches_region(user_client, products, region, monkeypatch):
    _user, _profile, client = user_client
    product = products[0]
    url = reverse("payments-checkout")

    monkeypatch.setattr(
        "payments.api.create_payment_intent",
        lambda **kwargs: {"id": "pi_test", "client_secret": "cs_test"},
    )

    response = client.post(
        url,
        _base_payload(product, order_type=Order.OrderType.DELIVERY, region_code=region.code),
        format="json",
    )
    assert response.status_code == status.HTTP_201_CREATED
    order = Order.objects.get(id=response.json()["order_id"])
    assert order.region == region


def test_pickup_does_not_require_region_code(user_client, products, monkeypatch):
    _user, _profile, client = user_client
    product = products[0]
    url = reverse("payments-checkout")

    monkeypatch.setattr(
        "payments.api.create_payment_intent",
        lambda **kwargs: {"id": "pi_test_pickup", "client_secret": "cs_pickup"},
    )

    response = client.post(
        url,
        _base_payload(product, order_type=Order.OrderType.PICKUP),
        format="json",
    )
    assert response.status_code == status.HTTP_201_CREATED
    order = Order.objects.get(id=response.json()["order_id"])
    assert order.region is None
