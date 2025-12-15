import datetime
import logging
from datetime import date, time
from typing import Dict, List

from celery import shared_task
from django.db import transaction
from django.db.models import Max
from django.utils import timezone

from orders.models import Order, Region
from delivery.models import DeliveryRoute, Driver, RouteStop
from delivery.google_routes import optimize_route_with_google
from notifications.tasks import send_delivery_eta_email_task

logger = logging.getLogger(__name__)


def _next_delivery_date(region: Region, today: date | None = None) -> date:
    """
    Return the next calendar date strictly in the future that matches
    region.delivery_weekday (0=Mon..6=Sun).
    """
    base_date = today or timezone.now().date()
    days_ahead = (region.delivery_weekday - base_date.weekday()) % 7
    if days_ahead == 0:
        days_ahead = 7
    return base_date + datetime.timedelta(days=days_ahead)


@shared_task(name="delivery.generate_delivery_routes", queue="logistics")
def generate_delivery_routes() -> dict:
    """
    Group paid delivery orders into delivery routes by region and delivery day.
    """
    now = timezone.now()
    today_date = now.date()
    current_tz = timezone.get_current_timezone()

    drivers_by_weekday = _drivers_by_weekday()

    eligible_orders = (
        Order.objects.select_related("region")
        .filter(
            status=Order.Status.PAID,
            order_type=Order.OrderType.DELIVERY,
            region__isnull=False,
            route_stop__isnull=True,
        )
        .order_by("created_at", "id")
    )

    orders_by_region: Dict[int, List[Order]] = {}
    regions_by_id: Dict[int, Region] = {}
    for order in eligible_orders:
        region_id = order.region_id
        if region_id is None or order.region is None:
            continue
        regions_by_id[region_id] = order.region
        orders_by_region.setdefault(region_id, []).append(order)

    low_volume_regions: Dict[str, int] = {}
    created_route_ids: List[int] = []
    attached_order_ids: List[int] = []

    for region_id, region_orders in orders_by_region.items():
        region = regions_by_id[region_id]
        order_count = len(region_orders)
        if order_count < region.min_orders:
            low_volume_regions[region.code] = order_count
            logger.info(
                "Region %s has %s orders (< min %s); deferring route creation",
                region.code,
                order_count,
                region.min_orders,
            )
            continue

        delivery_date = _next_delivery_date(region, today=today_date)
        eta_dt = timezone.make_aware(
            datetime.datetime.combine(delivery_date, time(12, 0)),
            timezone=current_tz,
        )

        with transaction.atomic():
            route = (
                DeliveryRoute.objects.select_for_update()
                .filter(region=region, date=delivery_date, merged_into__isnull=True)
                .order_by("id")
                .first()
            )
            created = False
            if not route:
                route = DeliveryRoute.objects.create(
                    region=region,
                    date=delivery_date,
                    driver=None,
                    is_completed=False,
                )
                created = True

            if not route.driver_id:
                assigned_driver = _select_driver_for_region(region, delivery_date, drivers_by_weekday)
                if assigned_driver:
                    route.driver = assigned_driver
                    route.save(update_fields=["driver"])

            last_stop = route.stops.order_by("-sequence").first()
            next_sequence = (last_stop.sequence if last_stop else 0) + 1

            stops: List[RouteStop] = []
            updated_orders: List[Order] = []
            sequence = next_sequence
            for order in region_orders:
                stops.append(
                    RouteStop(
                        route=route,
                        order=order,
                        sequence=sequence,
                        status=RouteStop.Status.PENDING,
                    )
                )
                order.estimated_delivery_at = eta_dt
                updated_orders.append(order)
                sequence += 1

            RouteStop.objects.bulk_create(stops)
            Order.objects.bulk_update(updated_orders, ["estimated_delivery_at"])

        created_route_ids.append(route.id)
        attached_order_ids.extend(order.id for order in region_orders)

        for order in region_orders:
            try:
                send_delivery_eta_email_task.delay(order.id)
            except Exception:
                logger.exception(
                    "Failed to enqueue delivery ETA email for order %s", order.id
                )

        logger.info(
            "Route %s for region %s on %s %s with %s new stops",
            route.id,
            region.code,
            delivery_date,
            "created" if created else "updated",
            len(stops),
        )

    summary = {
        "created_routes": created_route_ids,
        "attached_orders": attached_order_ids,
        "low_volume_regions": low_volume_regions,
    }
    logger.info("Delivery route generation summary: %s", summary)
    return summary


def _drivers_by_weekday() -> Dict[int, List[Driver]]:
    drivers = Driver.objects.select_related("preferred_region").order_by("id")
    mapping: Dict[int, List[Driver]] = {}
    for driver in drivers:
        days = driver.operating_weekdays or list(range(7))
        for day in days:
            try:
                normalized = int(day)
            except (TypeError, ValueError):
                continue
            mapping.setdefault(normalized, []).append(driver)
    return mapping


def _select_driver_for_region(
    region: Region, delivery_date: datetime.date, drivers_by_weekday: Dict[int, List[Driver]]
) -> Driver | None:
    weekday = delivery_date.weekday()
    candidates = drivers_by_weekday.get(weekday, [])
    if not candidates:
        return None

    preferred_matches = [d for d in candidates if d.preferred_region_id == region.id]
    if preferred_matches:
        return preferred_matches[0]
    return candidates[0]


@shared_task(name="delivery.optimize_future_routes", queue="logistics")
def optimize_future_routes() -> dict:
    today = timezone.localdate()
    routes = (
        DeliveryRoute.objects.filter(date__gt=today, is_completed=False)
        .prefetch_related("stops__order")
        .order_by("date", "id")
    )

    optimized_routes: List[int] = []
    skipped_routes: Dict[int, str] = {}

    for route in routes:
        stops = list(route.stops.all().order_by("sequence", "id"))

        if len(stops) <= 1:
            skipped_routes[route.id] = "too_few_stops"
            continue

        optimized_stops = optimize_route_with_google(stops)
        if [stop.id for stop in optimized_stops] == [stop.id for stop in stops]:
            skipped_routes[route.id] = "no_change"
            continue

        max_sequence = (
            RouteStop.objects.filter(route=route).aggregate(max_seq=Max("sequence")).get(
                "max_seq"
            )
            or 0
        )
        temp_offset = max_sequence + 1000

        for sequence, stop in enumerate(optimized_stops, start=1):
            stop.sequence = temp_offset + sequence
        RouteStop.objects.bulk_update(optimized_stops, ["sequence"])

        for sequence, stop in enumerate(optimized_stops, start=1):
            stop.sequence = sequence
        RouteStop.objects.bulk_update(optimized_stops, ["sequence"])
        optimized_routes.append(route.id)
        logger.info(
            "Optimized route %s with %s stops",
            route.id,
            len(optimized_stops),
        )

    summary = {"optimized_routes": optimized_routes, "skipped_routes": skipped_routes}
    logger.info("Optimize future routes summary: %s", summary)
    return summary
