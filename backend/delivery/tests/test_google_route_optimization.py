import datetime
from unittest import mock

import requests
from django.test import TestCase
from django.utils import timezone

from delivery.google_routes import optimize_route_with_google
from delivery.models import DeliveryRoute, RouteStop
from delivery.tasks import optimize_future_routes
from orders.models import Order, Region


def create_region(code: str = "r1") -> Region:
    return Region.objects.create(
        code=code,
        name=f"Region {code}",
        delivery_weekday=timezone.now().date().weekday(),
        min_orders=1,
    )


def create_order(region: Region, suffix: str) -> Order:
    return Order.objects.create(
        full_name=f"Customer {suffix}",
        email=f"customer{suffix}@example.com",
        phone="+15550000000",
        address_line1=f"{suffix} Main St",
        address_line2="Unit 1",
        city="Townsville",
        postal_code="12345",
        order_type=Order.OrderType.DELIVERY,
        status=Order.Status.PAID,
        region=region,
    )


def create_route_with_stops(
    region: Region, date, stop_count: int = 4, is_completed: bool = False
) -> tuple[DeliveryRoute, list[RouteStop]]:
    route = DeliveryRoute.objects.create(
        region=region, date=date, driver=None, is_completed=is_completed
    )
    stops: list[RouteStop] = []
    for idx in range(stop_count):
        order = create_order(region, suffix=str(idx))
        stop = RouteStop.objects.create(
            route=route,
            order=order,
            sequence=idx + 1,
            status=RouteStop.Status.PENDING,
        )
        stops.append(stop)
    return route, stops


class OptimizeRouteWithGoogleTests(TestCase):
    @mock.patch("delivery.google_routes.requests.get")
    def test_missing_api_key_returns_original_order(self, mock_get):
        region = create_region()
        _, stops = create_route_with_stops(region, date=timezone.localdate(), stop_count=3)

        with self.settings(GOOGLE_MAPS_API_KEY=""):
            ordered = optimize_route_with_google(stops)

        self.assertEqual([s.id for s in ordered], [s.id for s in stops])
        mock_get.assert_not_called()

    @mock.patch("delivery.google_routes.requests.get")
    def test_valid_waypoint_order_reorders_stops(self, mock_get):
        region = create_region()
        _, stops = create_route_with_stops(region, date=timezone.localdate(), stop_count=4)

        class FakeResponse:
            status_code = 200

            def raise_for_status(self):
                return None

            def json(self):
                return {"status": "OK", "routes": [{"waypoint_order": [2, 0, 1]}]}

        mock_get.return_value = FakeResponse()

        with self.settings(GOOGLE_MAPS_API_KEY="fake-key"):
            ordered = optimize_route_with_google(stops)

        expected_ids = [stops[0].id, stops[3].id, stops[1].id, stops[2].id]
        self.assertEqual([s.id for s in ordered], expected_ids)
        mock_get.assert_called_once()

    @mock.patch("delivery.google_routes.requests.get")
    def test_error_response_returns_original_order(self, mock_get):
        region = create_region()
        _, stops = create_route_with_stops(region, date=timezone.localdate(), stop_count=3)

        mock_get.side_effect = requests.RequestException("boom")

        with self.settings(GOOGLE_MAPS_API_KEY="fake-key"):
            ordered = optimize_route_with_google(stops)

        self.assertEqual([s.id for s in ordered], [s.id for s in stops])


class OptimizeFutureRoutesTaskTests(TestCase):
    def setUp(self):
        self.region = create_region(code="future")

    @mock.patch("delivery.tasks.optimize_route_with_google")
    def test_future_incomplete_routes_are_resequenced(self, mock_optimize):
        today = timezone.localdate()
        future_date = today + datetime.timedelta(days=2)
        past_date = today - datetime.timedelta(days=1)

        future_route, future_stops = create_route_with_stops(
            self.region, date=future_date, stop_count=3
        )
        create_route_with_stops(self.region, date=past_date, stop_count=2)
        create_route_with_stops(
            self.region, date=future_date, stop_count=2, is_completed=True
        )

        mock_optimize.side_effect = lambda stops: list(reversed(stops))

        summary = optimize_future_routes()

        updated_stops = list(
            future_route.stops.order_by("sequence").select_related("order")
        )
        self.assertEqual([stop.sequence for stop in updated_stops], [1, 2, 3])
        self.assertEqual(
            [s.id for s in updated_stops],
            [s.id for s in reversed(future_stops)],
        )
        self.assertIn(future_route.id, summary["optimized_routes"])
        self.assertNotIn(future_route.id, summary["skipped_routes"])
        mock_optimize.assert_called_once_with(future_stops)
