import datetime

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from delivery.models import DeliveryRoute, Driver, RouteStop
from delivery.permissions import IsDriver
from orders.models import Order, Region


class DriverRoutesAPITestCase(APITestCase):
    def setUp(self):
        self.user_counter = 0

    def create_user(self, username_prefix="user"):
        self.user_counter += 1
        username = f"{username_prefix}{self.user_counter}"
        email = f"{username}@example.com"
        return get_user_model().objects.create_user(
            username=username,
            email=email,
            password="testpass123",
        )

    def create_driver(self, user=None):
        user = user or self.create_user("driver")
        return Driver.objects.create(user=user)

    def create_region(self, code="R1", name="Region 1", delivery_weekday=1):
        return Region.objects.create(
            code=code,
            name=name,
            delivery_weekday=delivery_weekday,
        )

    def create_order(
        self,
        region,
        full_name="John Doe",
        phone="123456789",
        address_line1="123 Main St",
        address_line2="Apt 1",
        city="Townsville",
        postal_code="12345",
    ):
        return Order.objects.create(
            full_name=full_name,
            email=f"{full_name.replace(' ', '').lower()}@example.com",
            phone=phone,
            address_line1=address_line1,
            address_line2=address_line2,
            city=city,
            postal_code=postal_code,
            region=region,
            order_type=Order.OrderType.DELIVERY,
        )

    def create_route(self, region, driver, date, is_completed=False):
        return DeliveryRoute.objects.create(
            region=region,
            driver=driver,
            date=date,
            is_completed=is_completed,
        )

    def create_stop(self, route, order, sequence, status_value=None, delivered_at=None):
        status_value = status_value or RouteStop.Status.PENDING
        return RouteStop.objects.create(
            route=route,
            order=order,
            sequence=sequence,
            status=status_value,
            delivered_at=delivered_at,
        )

    def test_permissions_require_driver(self):
        today_url = reverse("delivery:driver-routes-today")
        upcoming_url = reverse("delivery:driver-routes-upcoming")

        # Unauthenticated
        for url in [today_url, upcoming_url]:
            response = self.client.get(url)
            self.assertIn(
                response.status_code,
                (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN),
            )

        # Authenticated without driver profile
        user = self.create_user("nodriver")
        self.client.force_authenticate(user=user)
        for url in [today_url, upcoming_url]:
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
            self.assertEqual(
                response.data.get("detail"),
                IsDriver.message,
            )

        # Authenticated with driver profile
        driver = self.create_driver(user)
        self.client.force_authenticate(user=driver.user)
        for url in [today_url, upcoming_url]:
            response = self.client.get(url)
            self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_today_routes_returns_only_driver_routes_with_stops(self):
        driver = self.create_driver()
        other_driver = self.create_driver()
        region = self.create_region(code="R1", name="Region 1")
        other_region = self.create_region(code="R2", name="Region 2")
        today = timezone.now().date()

        todays_route = self.create_route(region=region, driver=driver, date=today)
        self.create_route(region=other_region, driver=other_driver, date=today)
        self.create_route(
            region=region,
            driver=driver,
            date=today + datetime.timedelta(days=1),
        )
        self.create_route(
            region=region,
            driver=driver,
            date=today - datetime.timedelta(days=1),
        )

        order1 = self.create_order(
            region=region,
            full_name="Alice Smith",
            phone="111-111",
            address_line1="10 Downing St",
            address_line2="",
            city="London",
            postal_code="SW1A 2AA",
        )
        order2 = self.create_order(
            region=region,
            full_name="Bob Jones",
            phone="222-222",
            address_line1="1600 Pennsylvania Ave",
            address_line2="NW",
            city="Washington",
            postal_code="20500",
        )
        stop1 = self.create_stop(route=todays_route, order=order1, sequence=1)
        stop2 = self.create_stop(route=todays_route, order=order2, sequence=2)

        self.client.force_authenticate(user=driver.user)
        url = reverse("delivery:driver-routes-today")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        route_data = response.data[0]
        self.assertEqual(route_data["id"], todays_route.id)
        self.assertEqual(route_data["region"], region.id)
        self.assertEqual(route_data["region_code"], region.code)
        self.assertEqual(route_data["region_name"], region.name)
        self.assertEqual(route_data["date"], today.isoformat())
        self.assertEqual(route_data["is_completed"], False)
        self.assertEqual(len(route_data["stops"]), 2)

        stops_by_id = {stop1.id: order1, stop2.id: order2}
        for stop_data in route_data["stops"]:
            order = stops_by_id[stop_data["id"]]
            expected_address = ", ".join(
                part
                for part in [
                    order.address_line1,
                    order.address_line2,
                    order.city,
                    order.postal_code,
                ]
                if part
            )
            self.assertEqual(stop_data["order_id"], order.id)
            self.assertEqual(stop_data["client_name"], order.full_name)
            self.assertEqual(stop_data["client_phone"], order.phone)
            self.assertEqual(stop_data["address"], expected_address)
            self.assertIsNotNone(stop_data["sequence"])
            self.assertIn(stop_data["status"], RouteStop.Status.values)
            self.assertIn("delivered_at", stop_data)

    def test_upcoming_routes_filtering_and_counts(self):
        driver = self.create_driver()
        other_driver = self.create_driver()
        region1 = self.create_region(code="A1", name="Alpha")
        region2 = self.create_region(code="B1", name="Beta")
        today = timezone.now().date()

        future_route1 = self.create_route(
            region=region1,
            driver=driver,
            date=today + datetime.timedelta(days=1),
        )
        future_route2 = self.create_route(
            region=region2,
            driver=driver,
            date=today + datetime.timedelta(days=2),
        )
        self.create_route(
            region=region1,
            driver=driver,
            date=today + datetime.timedelta(days=3),
            is_completed=True,
        )
        self.create_route(
            region=region1,
            driver=other_driver,
            date=today + datetime.timedelta(days=1),
        )
        self.create_route(region=region1, driver=driver, date=today)
        self.create_route(
            region=region1,
            driver=driver,
            date=today - datetime.timedelta(days=1),
        )

        order1 = self.create_order(region=region1, full_name="Future One", phone="333")
        order2 = self.create_order(region=region1, full_name="Future Two", phone="444")
        order3 = self.create_order(region=region2, full_name="Future Three", phone="555")

        self.create_stop(route=future_route1, order=order1, sequence=1)
        self.create_stop(route=future_route1, order=order2, sequence=2)
        self.create_stop(route=future_route2, order=order3, sequence=1)

        self.client.force_authenticate(user=driver.user)
        url = reverse("delivery:driver-routes-upcoming")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)

        route_ids = [route["id"] for route in response.data]
        self.assertEqual(route_ids, [future_route1.id, future_route2.id])

        stops_counts = {route["id"]: route["stops_count"] for route in response.data}
        self.assertEqual(stops_counts[future_route1.id], 2)
        self.assertEqual(stops_counts[future_route2.id], 1)
