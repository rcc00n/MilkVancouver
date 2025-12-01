import datetime

import pytest
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.db import IntegrityError, transaction
from django.test import Client, override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from delivery.models import DeliveryRoute, Driver, RouteStop
from orders.models import Order, Region

pytestmark = pytest.mark.django_db


def create_user(email: str, **kwargs):
    user_model = get_user_model()
    return user_model.objects.create_user(
        username=email, email=email, password="password123", **kwargs
    )


def create_region(code="R1", name="Region 1"):
    return Region.objects.create(code=code, name=name, delivery_weekday=1, min_orders=0)


def create_order(region, full_name="Customer", email="customer@example.com"):
    return Order.objects.create(
        full_name=full_name,
        email=email,
        phone="+15550000000",
        order_type=Order.OrderType.DELIVERY,
        address_line1="123 Main St",
        city="Townsville",
        postal_code="12345",
        region=region,
    )


def test_driver_relationship_and_cascade():
    user = create_user("driver@example.com")
    driver = Driver.objects.create(user=user, phone="123", notes="note")

    assert driver.user == user
    user_id = user.id
    user.delete()

    assert not Driver.objects.filter(user_id=user_id).exists()


def test_route_stops_ordering_and_constraints():
    region = create_region()
    driver_user = create_user("route-driver@example.com")
    driver = Driver.objects.create(user=driver_user)
    today = timezone.now().date()
    route = DeliveryRoute.objects.create(region=region, date=today, driver=driver)

    order1 = create_order(region, full_name="One", email="one@example.com")
    order2 = create_order(region, full_name="Two", email="two@example.com")
    order3 = create_order(region, full_name="Three", email="three@example.com")

    RouteStop.objects.create(route=route, order=order1, sequence=2)
    RouteStop.objects.create(route=route, order=order2, sequence=1)
    RouteStop.objects.create(route=route, order=order3, sequence=3)

    sequences = list(route.stops.values_list("sequence", flat=True))
    assert sequences == [1, 2, 3]

    with pytest.raises(IntegrityError):
        with transaction.atomic():
            RouteStop.objects.create(route=route, order=order1, sequence=1)

    another_route = DeliveryRoute.objects.create(
        region=region, date=today + datetime.timedelta(days=1)
    )
    with pytest.raises(IntegrityError):
        with transaction.atomic():
            RouteStop.objects.create(route=another_route, order=order1, sequence=1)

    assert route.stops_count == 3

    assert "Driver" in str(driver)
    assert region.code in str(route)
    assert str(route.date) in str(route)
    stop_for_order1 = RouteStop.objects.get(order=order1)
    assert str(order1.id) in str(stop_for_order1)
    assert str(route.id) in str(stop_for_order1)


def test_my_routes_view_happy_path():
    client = APIClient()
    today = timezone.now().date()
    other_day = today + datetime.timedelta(days=1)

    user = create_user("driver@example.com", first_name="Route", last_name="Driver")
    driver = Driver.objects.create(user=user)
    region = create_region("R2", "Region Two")

    route_today = DeliveryRoute.objects.create(region=region, date=today, driver=driver)
    DeliveryRoute.objects.create(region=region, date=other_day, driver=driver)

    orders = [
        create_order(region, full_name=f"Customer {i}", email=f"c{i}@example.com")
        for i in range(1, 4)
    ]
    for idx, order in enumerate(orders, start=1):
        RouteStop.objects.create(route=route_today, order=order, sequence=idx)

    client.force_authenticate(user=user)
    url = reverse("delivery:my-routes")
    response = client.get(url, {"date": today.isoformat()})

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    route_payload = data[0]
    assert route_payload["id"] == route_today.id
    assert route_payload["region"] == region.id
    assert route_payload["region_name"] == region.name
    assert "Route Driver" == route_payload["driver_name"]
    sequences = [stop["sequence"] for stop in route_payload["stops"]]
    assert sequences == [1, 2, 3]


def test_my_routes_view_forbidden_for_non_driver():
    client = APIClient()
    user = create_user("user@example.com")
    client.force_authenticate(user=user)

    response = client.get(reverse("delivery:my-routes"))

    assert response.status_code == 403
    assert response.json().get("detail") == "You are not registered as a driver."


def test_my_routes_view_unauthenticated():
    client = APIClient()
    response = client.get(reverse("delivery:my-routes"))
    assert response.status_code in (401, 403)


def test_route_stops_view_happy_path_for_driver():
    client = APIClient()
    user = create_user("driver2@example.com")
    driver = Driver.objects.create(user=user)
    region = create_region("R3", "Region Three")
    route = DeliveryRoute.objects.create(region=region, date=timezone.now().date(), driver=driver)

    order_a = create_order(region, full_name="A", email="a@example.com")
    order_b = create_order(region, full_name="B", email="b@example.com")
    RouteStop.objects.create(route=route, order=order_a, sequence=2)
    RouteStop.objects.create(route=route, order=order_b, sequence=1)

    client.force_authenticate(user=user)
    response = client.get(reverse("delivery:route-stops", args=[route.id]))

    assert response.status_code == 200
    data = response.json()
    sequences = [stop["sequence"] for stop in data]
    assert sequences == [1, 2]
    assert data[0]["order"]["id"] == order_b.id
    assert data[1]["order"]["id"] == order_a.id


def test_route_stops_view_forbidden_for_other_user():
    client = APIClient()
    driver_user = create_user("assigned@example.com")
    other_user = create_user("other@example.com")
    driver = Driver.objects.create(user=driver_user)
    region = create_region("R4", "Region Four")
    route = DeliveryRoute.objects.create(region=region, date=timezone.now().date(), driver=driver)

    order = create_order(region, full_name="Only", email="only@example.com")
    RouteStop.objects.create(route=route, order=order, sequence=1)

    client.force_authenticate(user=other_user)
    response = client.get(reverse("delivery:route-stops", args=[route.id]))

    assert response.status_code == 403
    assert response.json().get("detail") == "You do not have permission to view this route."


def test_route_stops_view_staff_can_access():
    client = APIClient()
    driver_user = create_user("assigned2@example.com")
    staff_user = create_user("staff@example.com", is_staff=True)
    driver = Driver.objects.create(user=driver_user)
    region = create_region("R5", "Region Five")
    route = DeliveryRoute.objects.create(region=region, date=timezone.now().date(), driver=driver)

    order = create_order(region, full_name="Staff", email="staff@example.com")
    RouteStop.objects.create(route=route, order=order, sequence=1)

    client.force_authenticate(user=staff_user)
    response = client.get(reverse("delivery:route-stops", args=[route.id]))

    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["order"]["id"] == order.id


def test_route_stops_view_unauthenticated():
    client = APIClient()
    route = DeliveryRoute.objects.create(region=create_region("R6", "Region Six"), date=timezone.now().date())
    response = client.get(reverse("delivery:route-stops", args=[route.id]))
    assert response.status_code in (401, 403)


def test_admin_registration_and_changelist_access():
    assert Driver in admin.site._registry
    assert DeliveryRoute in admin.site._registry
    assert RouteStop in admin.site._registry

    user = create_user("admin@example.com", is_staff=True, is_superuser=True)
    client = Client()
    client.force_login(user)
    with override_settings(
        STORAGES={
            "staticfiles": {
                "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage",
            }
        }
    ):
        response = client.get(reverse("admin:delivery_deliveryroute_changelist"))
    assert response.status_code == 200
