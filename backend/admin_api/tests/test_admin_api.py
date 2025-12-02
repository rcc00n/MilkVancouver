from __future__ import annotations

from datetime import date
from typing import List
from uuid import uuid4

from django.contrib.auth import get_user_model
from django.test import override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from delivery.models import DeliveryRoute, Driver, RouteStop
from orders.models import Order, OrderItem, Region
from products.models import Product


User = get_user_model()


@override_settings(ROOT_URLCONF="tests.urlconf")
class AdminApiTestCase(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_user(
            username="admin@example.com",
            email="admin@example.com",
            password="password123",
        )
        self.admin_user.is_staff = True
        self.admin_user.save(update_fields=["is_staff"])

        self.regular_user = User.objects.create_user(
            username="user@example.com",
            email="user@example.com",
            password="password123",
        )

        self.admin_client = APIClient()
        self.admin_client.force_authenticate(self.admin_user)

        self.regular_client = APIClient()
        self.regular_client.force_authenticate(self.regular_user)

    def create_region(self, code: str, name: str | None = None) -> Region:
        region, created = Region.objects.get_or_create(
            code=code,
            defaults={
                "name": name or code.title(),
                "delivery_weekday": 1,
                "min_orders": 0,
            },
        )
        if not created and name and region.name != name:
            region.name = name
            region.save(update_fields=["name"])
        return region

    def create_product(self, name: str = "Product", price_cents: int = 500) -> Product:
        suffix = uuid4().hex[:6]
        return Product.objects.create(
            name=f"{name}-{suffix}",
            slug=f"{name}-{suffix}".lower(),
            description="",
            price_cents=price_cents,
            main_image_url="",
            category="dairy",
        )

    def create_order(self, **kwargs) -> Order:
        defaults = {
            "full_name": "Customer",
            "email": "customer@example.com",
            "phone": "555-0000",
            "order_type": Order.OrderType.DELIVERY,
            "status": Order.Status.PAID,
            "total_cents": 1000,
        }
        defaults.update(kwargs)
        return Order.objects.create(**defaults)


class AdminApiPermissionTests(AdminApiTestCase):
    def setUp(self):
        super().setUp()
        region = self.create_region("north")
        orders = [
            self.create_order(region=region, full_name="Order One", email="one@example.com"),
            self.create_order(region=region, full_name="Order Two", email="two@example.com"),
        ]
        driver_user = User.objects.create_user(
            username="driver@example.com",
            email="driver@example.com",
            password="password123",
        )
        driver = Driver.objects.create(user=driver_user)
        route = DeliveryRoute.objects.create(region=region, date=date.today(), driver=driver)
        self.stops: List[RouteStop] = [
            RouteStop.objects.create(route=route, order=orders[idx], sequence=idx + 1)
            for idx in range(2)
        ]
        self.route = route

    def test_admin_user_can_access_endpoints_and_regular_user_forbidden(self):
        endpoints = {
            "dashboard": ("get", reverse("admin_api:dashboard"), None),
            "clients": ("get", reverse("admin_api:clients"), None),
            "routes_list": ("get", reverse("admin_api:routes-list"), None),
            "routes_detail": ("get", reverse("admin_api:routes-detail", args=[self.route.id]), None),
            "routes_reorder": (
                "post",
                reverse("admin_api:routes-reorder", args=[self.route.id]),
                {"stop_ids": [self.stops[1].id, self.stops[0].id]},
            ),
        }

        for _, (method, url, payload) in endpoints.items():
            admin_response = getattr(self.admin_client, method)(url, payload, format="json")
            self.assertNotEqual(
                admin_response.status_code,
                status.HTTP_403_FORBIDDEN,
                msg=f"Admin received 403 for {url}",
            )

            regular_response = getattr(self.regular_client, method)(url, payload, format="json")
            self.assertEqual(
                regular_response.status_code,
                status.HTTP_403_FORBIDDEN,
                msg=f"Regular user should be forbidden for {url}",
            )


class AdminDashboardApiTests(AdminApiTestCase):
    def test_dashboard_empty_returns_zeroes(self):
        response = self.admin_client.get(reverse("admin_api:dashboard"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["total_sales_cents"], 0)
        self.assertEqual(data["total_sales"], 0)
        self.assertEqual(data["orders_by_status"], {})
        self.assertEqual(data["top_regions"], [])
        self.assertEqual(data["top_products"], [])

    def test_dashboard_aggregates_orders_and_items(self):
        region_north = self.create_region("north", "North")
        region_south = self.create_region("south", "South")
        product_a = self.create_product("Milk", 200)
        product_b = self.create_product("Cheese", 300)

        order_paid_1 = self.create_order(status=Order.Status.PAID, total_cents=1500, region=region_north)
        order_paid_2 = self.create_order(status=Order.Status.PAID, total_cents=500, region=region_north)
        self.create_order(status=Order.Status.COMPLETED, total_cents=250, region=region_north)
        self.create_order(status=Order.Status.CANCELLED, total_cents=100, region=region_south)

        OrderItem.objects.create(
            order=order_paid_1,
            product=product_a,
            product_name=product_a.name,
            quantity=2,
            unit_price_cents=200,
            total_cents=400,
        )
        OrderItem.objects.create(
            order=order_paid_1,
            product=product_b,
            product_name=product_b.name,
            quantity=1,
            unit_price_cents=300,
            total_cents=300,
        )
        OrderItem.objects.create(
            order=order_paid_2,
            product=product_b,
            product_name=product_b.name,
            quantity=3,
            unit_price_cents=300,
            total_cents=900,
        )

        response = self.admin_client.get(reverse("admin_api:dashboard"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        self.assertEqual(data["total_sales_cents"], 2000)
        self.assertEqual(data["total_sales"], 20.0)

        self.assertEqual(
            data["orders_by_status"].get(Order.Status.PAID),
            2,
        )
        self.assertEqual(
            data["orders_by_status"].get(Order.Status.COMPLETED),
            1,
        )
        self.assertEqual(
            data["orders_by_status"].get(Order.Status.CANCELLED),
            1,
        )

        self.assertEqual(
            data["top_regions"][0],
            {"code": region_north.code, "name": region_north.name, "order_count": 3},
        )

        top_products = data["top_products"]
        self.assertEqual(top_products[0]["product_id"], product_b.id)
        self.assertEqual(top_products[0]["quantity_sold"], 4)
        self.assertEqual(top_products[0]["total_revenue_cents"], 1200)
        self.assertEqual(top_products[1]["product_id"], product_a.id)
        self.assertEqual(top_products[1]["quantity_sold"], 2)
        self.assertEqual(top_products[1]["total_revenue_cents"], 400)


class AdminClientsApiTests(AdminApiTestCase):
    def test_clients_aggregate_successful_orders_only(self):
        region_north = self.create_region("north", "North")
        region_south = self.create_region("south", "South")

        user_one = User.objects.create_user(username="user1@example.com", email="user1@example.com")
        user_two = User.objects.create_user(username="user2@example.com", email="user2@example.com")
        user_three = User.objects.create_user(username="user3@example.com", email="user3@example.com")
        user_four = User.objects.create_user(username="user4@example.com", email="user4@example.com")

        self.create_order(user=user_one, status=Order.Status.PAID, total_cents=1000, region=region_north)
        self.create_order(user=user_one, status=Order.Status.COMPLETED, total_cents=2000, region=region_north)
        self.create_order(user=user_one, status=Order.Status.PENDING, total_cents=9999, region=region_south)

        self.create_order(user=user_two, status=Order.Status.PAID, total_cents=500, region=region_south)
        self.create_order(user=user_two, status=Order.Status.COMPLETED, total_cents=500, region=region_south)

        self.create_order(user=user_three, status=Order.Status.PENDING, total_cents=400, region=region_north)

        self.create_order(user=user_four, status=Order.Status.PAID, total_cents=750, region=None)

        response = self.admin_client.get(reverse("admin_api:clients"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()

        users_by_id = {entry["user_id"]: entry for entry in data}

        user_one_entry = users_by_id[user_one.id]
        self.assertEqual(user_one_entry["total_orders"], 2)
        self.assertEqual(user_one_entry["total_spent_cents"], 3000)
        self.assertEqual(user_one_entry["total_spent"], 30.0)
        self.assertEqual(
            user_one_entry["most_frequent_region"],
            {"code": region_north.code, "name": region_north.name},
        )

        user_two_entry = users_by_id[user_two.id]
        self.assertEqual(user_two_entry["total_orders"], 2)
        self.assertEqual(user_two_entry["total_spent_cents"], 1000)
        self.assertEqual(user_two_entry["total_spent"], 10.0)
        self.assertEqual(
            user_two_entry["most_frequent_region"],
            {"code": region_south.code, "name": region_south.name},
        )

        self.assertNotIn(user_three.id, users_by_id)

        user_four_entry = users_by_id[user_four.id]
        self.assertIsNone(user_four_entry["most_frequent_region"])


class AdminRoutesApiTests(AdminApiTestCase):
    def setUp(self):
        super().setUp()
        self.region_north = self.create_region("north", "North")
        self.region_south = self.create_region("south", "South")
        driver_user = User.objects.create_user(username="driver@example.com", email="driver@example.com")
        self.driver = Driver.objects.create(user=driver_user)

        self.route_recent = DeliveryRoute.objects.create(
            region=self.region_north, date=date(2024, 1, 2), driver=self.driver
        )
        self.route_older = DeliveryRoute.objects.create(
            region=self.region_south, date=date(2024, 1, 1), driver=self.driver
        )
        self.route_same_day = DeliveryRoute.objects.create(
            region=self.region_south, date=date(2024, 1, 2), driver=None
        )

        self._populate_route(self.route_recent, order_start=1)
        self._populate_route(self.route_older, order_start=3)
        self._populate_route(self.route_same_day, order_start=5)

    def _populate_route(self, route: DeliveryRoute, order_start: int = 1):
        for idx in range(2):
            order = self.create_order(
                full_name=f"Customer {order_start + idx}",
                email=f"customer{order_start + idx}@example.com",
                phone="555-0000",
                region=route.region,
            )
            RouteStop.objects.create(route=route, order=order, sequence=idx + 1)

    def test_routes_list_orders_and_filters(self):
        url = reverse("admin_api:routes-list")
        response = self.admin_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        ids = [route["id"] for route in data]
        self.assertEqual(ids, [self.route_recent.id, self.route_same_day.id, self.route_older.id])

        date_filtered = self.admin_client.get(url, {"date": "2024-01-02"})
        self.assertEqual(
            {route["id"] for route in date_filtered.json()},
            {self.route_recent.id, self.route_same_day.id},
        )

        region_filtered = self.admin_client.get(url, {"region": "NORTH"})
        self.assertEqual(
            [route["id"] for route in region_filtered.json()],
            [self.route_recent.id],
        )

        driver_filtered = self.admin_client.get(url, {"driver_id": str(self.driver.id)})
        self.assertEqual(
            {route["id"] for route in driver_filtered.json()},
            {self.route_recent.id, self.route_older.id},
        )

    def test_route_detail_includes_stops_and_order_info(self):
        url = reverse("admin_api:routes-detail", args=[self.route_recent.id])
        response = self.admin_client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["id"], self.route_recent.id)
        self.assertEqual(data["region"], self.region_north.id)
        self.assertEqual(len(data["stops"]), 2)
        stop = data["stops"][0]
        self.assertIn("order", stop)
        self.assertIn("full_name", stop["order"])


class AdminRouteReorderApiTests(AdminApiTestCase):
    def setUp(self):
        super().setUp()
        self.region = self.create_region("north")
        driver_user = User.objects.create_user(username="driver2@example.com", email="driver2@example.com")
        self.driver = Driver.objects.create(user=driver_user)
        self.route = DeliveryRoute.objects.create(region=self.region, date=date.today(), driver=self.driver)
        orders = [
            self.create_order(full_name="A", email="a@example.com", region=self.region),
            self.create_order(full_name="B", email="b@example.com", region=self.region),
            self.create_order(full_name="C", email="c@example.com", region=self.region),
        ]
        self.stops = [
            RouteStop.objects.create(route=self.route, order=orders[0], sequence=10),
            RouteStop.objects.create(route=self.route, order=orders[1], sequence=20),
            RouteStop.objects.create(route=self.route, order=orders[2], sequence=30),
        ]

        other_route = DeliveryRoute.objects.create(
            region=self.create_region("south"), date=date.today(), driver=None
        )
        other_order = self.create_order(full_name="Other", email="other@example.com", region=other_route.region)
        self.other_stop = RouteStop.objects.create(route=other_route, order=other_order, sequence=1)

    def test_reorder_updates_sequence_and_returns_route(self):
        new_order = [self.stops[2].id, self.stops[0].id, self.stops[1].id]
        url = reverse("admin_api:routes-reorder", args=[self.route.id])
        response = self.admin_client.post(url, {"stop_ids": new_order}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        returned_stop_ids = [stop["id"] for stop in data["stops"]]
        self.assertEqual(returned_stop_ids, new_order)

        self.route.refresh_from_db()
        sequences = list(
            self.route.stops.order_by("sequence").values_list("id", "sequence")
        )
        self.assertEqual([item[0] for item in sequences], new_order)
        self.assertEqual([item[1] for item in sequences], [1, 2, 3])

    def test_reorder_rejects_missing_or_extra_ids(self):
        url = reverse("admin_api:routes-reorder", args=[self.route.id])
        missing_response = self.admin_client.post(
            url, {"stop_ids": [self.stops[0].id, self.stops[1].id]}, format="json"
        )
        self.assertEqual(missing_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("must match exactly the set of stops", missing_response.json()["detail"])

        extra_response = self.admin_client.post(
            url,
            {"stop_ids": [self.stops[0].id, self.stops[1].id, self.stops[2].id, self.other_stop.id]},
            format="json",
        )
        self.assertEqual(extra_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("must match exactly the set of stops", extra_response.json()["detail"])

    def test_reorder_does_not_affect_other_routes(self):
        url = reverse("admin_api:routes-reorder", args=[self.route.id])
        new_order = [self.stops[1].id, self.stops[2].id, self.stops[0].id]
        self.admin_client.post(url, {"stop_ids": new_order}, format="json")

        other_sequences = list(
            RouteStop.objects.filter(route=self.other_stop.route)
            .order_by("sequence")
            .values_list("id", "sequence")
        )
        self.assertEqual(other_sequences, [(self.other_stop.id, 1)])
