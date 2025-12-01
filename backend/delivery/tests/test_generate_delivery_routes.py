import datetime
import uuid
from unittest.mock import call, patch

from django.test import TestCase
from django.utils import timezone

from delivery.models import DeliveryRoute, RouteStop
from delivery.tasks import _next_delivery_date, generate_delivery_routes
from orders.models import Order, Region


def create_region(code=None, min_orders=2, delivery_weekday=None):
    weekday = delivery_weekday if delivery_weekday is not None else timezone.now().date().weekday()
    region_code = code or f"region-{uuid.uuid4().hex[:8]}"
    return Region.objects.create(
        code=region_code,
        name=f"Region {region_code}",
        delivery_weekday=weekday,
        min_orders=min_orders,
    )


def create_order(region: Region, status=Order.Status.PAID, order_type=Order.OrderType.DELIVERY):
    return Order.objects.create(
        full_name="Customer",
        email="customer@example.com",
        phone="+15550000000",
        address_line1="123 Main St",
        city="Townsville",
        postal_code="12345",
        order_type=order_type,
        status=status,
        region=region,
    )


class GenerateDeliveryRoutesTests(TestCase):
    @patch("delivery.tasks.send_delivery_eta_email_task.delay")
    def test_happy_path_creates_route_and_stops(self, mock_delay):
        region = create_region(min_orders=2)
        orders = [create_order(region) for _ in range(3)]

        summary = generate_delivery_routes()

        expected_date = _next_delivery_date(region, today=timezone.now().date())
        route = DeliveryRoute.objects.get(region=region, date=expected_date, driver=None)
        self.assertFalse(route.is_completed)
        stops = list(route.stops.order_by("sequence"))
        self.assertEqual(len(stops), len(orders))
        self.assertEqual([stop.order_id for stop in stops], [order.id for order in orders])
        self.assertEqual([stop.sequence for stop in stops], list(range(1, len(orders) + 1)))

        for order in orders:
            order.refresh_from_db()
            self.assertEqual(order.route_stop.route_id, route.id)
            self.assertIsNotNone(order.estimated_delivery_at)
            self.assertEqual(order.estimated_delivery_at.date(), expected_date)

        self.assertIn(route.id, summary["created_routes"])
        self.assertCountEqual(summary["attached_orders"], [order.id for order in orders])
        mock_delay.assert_has_calls([call(order.id) for order in orders], any_order=False)
        self.assertEqual(mock_delay.call_count, len(orders))

    @patch("delivery.tasks.send_delivery_eta_email_task.delay")
    def test_low_volume_region_skipped(self, mock_delay):
        region = create_region(code="low", min_orders=5)
        orders = [create_order(region) for _ in range(2)]

        summary = generate_delivery_routes()

        self.assertEqual(DeliveryRoute.objects.count(), 0)
        for order in orders:
            order.refresh_from_db()
            self.assertFalse(RouteStop.objects.filter(order=order).exists())
            self.assertIsNone(order.estimated_delivery_at)

        self.assertEqual(summary["low_volume_regions"].get(region.code), len(orders))
        mock_delay.assert_not_called()

    @patch("delivery.tasks.send_delivery_eta_email_task.delay")
    def test_rerun_appends_to_existing_route(self, mock_delay):
        region = create_region(min_orders=2)
        first_orders = [create_order(region) for _ in range(2)]
        generate_delivery_routes()

        route = DeliveryRoute.objects.get(region=region, driver=None)
        first_orders = [Order.objects.get(id=o.id) for o in first_orders]
        initial_eta = first_orders[0].estimated_delivery_at

        new_orders = [create_order(region) for _ in range(2)]
        generate_delivery_routes()

        self.assertEqual(
            DeliveryRoute.objects.filter(region=region, driver=None, date=route.date).count(),
            1,
        )
        stops = list(route.stops.order_by("sequence"))
        self.assertEqual(len(stops), 4)
        self.assertEqual([stop.sequence for stop in stops], [1, 2, 3, 4])
        self.assertEqual(stops[0].order_id, first_orders[0].id)
        self.assertEqual(stops[-1].order_id, new_orders[-1].id)

        first_orders[0].refresh_from_db()
        self.assertEqual(first_orders[0].estimated_delivery_at, initial_eta)

        self.assertEqual(mock_delay.call_count, 4)

    @patch("delivery.tasks.send_delivery_eta_email_task.delay")
    def test_orders_with_wrong_status_or_type_ignored(self, mock_delay):
        region = create_region()
        pending_order = create_order(region, status=Order.Status.PENDING)
        pickup_order = create_order(region, order_type=Order.OrderType.PICKUP, status=Order.Status.PAID)

        generate_delivery_routes()

        self.assertEqual(DeliveryRoute.objects.count(), 0)
        for order in (pending_order, pickup_order):
            order.refresh_from_db()
            self.assertFalse(RouteStop.objects.filter(order=order).exists())
            self.assertIsNone(order.estimated_delivery_at)
        mock_delay.assert_not_called()

    @patch("delivery.tasks.send_delivery_eta_email_task.delay")
    def test_orders_already_attached_are_ignored(self, mock_delay):
        region = create_region(min_orders=1)
        expected_date = _next_delivery_date(region, today=timezone.now().date())
        route = DeliveryRoute.objects.create(region=region, date=expected_date, driver=None)
        existing_order = create_order(region)
        RouteStop.objects.create(route=route, order=existing_order, sequence=1)

        new_order = create_order(region)
        summary = generate_delivery_routes()

        stops = list(route.stops.order_by("sequence"))
        self.assertEqual(len(stops), 2)
        self.assertEqual(stops[0].order_id, existing_order.id)
        self.assertEqual(stops[1].order_id, new_order.id)
        self.assertEqual(stops[1].sequence, 2)

        self.assertNotIn(existing_order.id, summary["attached_orders"])
        self.assertIn(new_order.id, summary["attached_orders"])
        mock_delay.assert_has_calls([call(new_order.id)])
        self.assertEqual(mock_delay.call_count, 1)
