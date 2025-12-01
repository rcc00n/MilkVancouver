import datetime
import logging
from datetime import date, time
from typing import Dict, List

from celery import shared_task
from django.db import transaction
from django.utils import timezone

from orders.models import Order, Region
from delivery.models import DeliveryRoute, RouteStop
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
            route, created = DeliveryRoute.objects.get_or_create(
                region=region,
                date=delivery_date,
                driver=None,
                defaults={"is_completed": False},
            )

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
