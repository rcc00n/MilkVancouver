from uuid import uuid4

import pytest

from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from orders.models import Order

pytestmark = pytest.mark.django_db


def create_user(email=None, password="Oldpass123!"):
    user_model = get_user_model()
    email = email or f"user-{uuid4().hex[:8]}@example.com"
    return user_model.objects.create_user(username=email, email=email, password=password)


def test_change_password_success():
    user = create_user()
    client = APIClient()
    client.force_authenticate(user=user)

    url = reverse("auth-change-password")
    payload = {
        "current_password": "Oldpass123!",
        "new_password": "Newpass456!",
        "new_password_confirm": "Newpass456!",
    }

    response = client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_200_OK
    assert response.json()["detail"] == "Password updated successfully."

    user.refresh_from_db()
    assert user.check_password("Newpass456!")


def test_change_password_rejects_invalid_current_password():
    user = create_user()
    client = APIClient()
    client.force_authenticate(user=user)

    url = reverse("auth-change-password")
    payload = {
        "current_password": "wrong-password",
        "new_password": "AnotherPass789!",
        "new_password_confirm": "AnotherPass789!",
    }

    response = client.post(url, payload, format="json")

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert "current_password" in response.json()


def test_logout_clears_session():
    user = create_user()
    client = APIClient()
    assert client.login(username=user.username, password="Oldpass123!")

    assert client.get(reverse("auth-me")).status_code == status.HTTP_200_OK

    logout_response = client.post(reverse("auth-logout"))
    assert logout_response.status_code == status.HTTP_200_OK
    assert logout_response.json()["detail"] == "Logged out."

    me_response = client.get(reverse("auth-me"))
    assert me_response.status_code in (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN)


def test_order_list_returns_only_authenticated_user_orders():
    owner = create_user(email="owner@example.com")
    other_user = create_user(email="other@example.com")

    owner_order = Order.objects.create(
        user=owner,
        full_name="Owner One",
        email=owner.email,
        phone="123-0000",
        order_type=Order.OrderType.PICKUP,
        subtotal_cents=1000,
        tax_cents=0,
        total_cents=1000,
    )
    Order.objects.create(
        user=other_user,
        full_name="Other User",
        email=other_user.email,
        phone="123-1111",
        order_type=Order.OrderType.PICKUP,
        subtotal_cents=500,
        tax_cents=0,
        total_cents=500,
    )

    client = APIClient()
    client.force_authenticate(user=owner)
    response = client.get(reverse("order-list"))

    assert response.status_code == status.HTTP_200_OK
    data = response.json()
    assert len(data) == 1
    assert data[0]["id"] == owner_order.id
