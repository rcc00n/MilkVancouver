import pytest
from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient

from accounts.models import CustomerProfile
from orders.models import Region
from products.models import Product
import uuid

User = get_user_model()

pytestmark = pytest.mark.django_db


@pytest.fixture
def user_client():
    user = User.objects.create_user(
        username=f"profileregion-{uuid.uuid4().hex[:6]}@example.com",
        email="profileregion@example.com",
        password="password123",
    )
    profile = CustomerProfile.objects.get(user=user)
    profile.email_verified_at = timezone.now()
    profile.phone_verified_at = timezone.now()
    profile.save(update_fields=["email_verified_at", "phone_verified_at"])
    client = APIClient()
    client.force_authenticate(user=user)
    return user, profile, client


def test_profile_patch_updates_region_fk(user_client):
    _user, profile, client = user_client
    region, _ = Region.objects.get_or_create(
        code="center",
        defaults={"name": "Center", "delivery_weekday": 3, "min_orders": 2},
    )
    url = reverse("customer-profile")
    response = client.patch(url, {"region_code": region.code}, format="json")
    assert response.status_code == status.HTTP_200_OK
    profile.refresh_from_db()
    assert profile.region == region
    assert profile.region_code == region.code


def test_profile_patch_unknown_region_sets_code_only(user_client):
    _user, profile, client = user_client
    url = reverse("customer-profile")
    response = client.patch(url, {"region_code": "unknown"}, format="json")
    assert response.status_code == status.HTTP_200_OK
    profile.refresh_from_db()
    assert profile.region is None
    assert profile.region_code == "unknown"


def test_checkout_updates_profile_region_when_used(user_client, monkeypatch):
    user, profile, client = user_client
    region, _ = Region.objects.get_or_create(
        code="south",
        defaults={"name": "South", "delivery_weekday": 4, "min_orders": 1},
    )
    product = Product.objects.create(name="Profile Milk", slug="profile-milk", price_cents=900)
    url = reverse("payments-checkout")
    monkeypatch.setattr(
        "payments.api.create_payment_intent",
        lambda **kwargs: {"id": "pi_profile", "client_secret": "cs_profile"},
    )

    payload = {
        "items": [{"product_id": product.id, "quantity": 1}],
        "full_name": "Profile User",
        "email": "profile@example.com",
        "phone": "555-9999",
        "order_type": "delivery",
        "address": {"line1": "123 St", "city": "Van", "postal_code": "V3V3V3"},
        "region_code": region.code,
    }
    response = client.post(url, payload, format="json")
    assert response.status_code == status.HTTP_201_CREATED
    profile.refresh_from_db()
    assert profile.region == region
    assert profile.region_code == region.code
