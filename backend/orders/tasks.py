import logging
from datetime import timedelta

from celery import shared_task
from django.utils import timezone

from orders.models import Order

logger = logging.getLogger(__name__)


@shared_task
def expire_stale_pending_orders() -> dict:
    now = timezone.now()
    cutoff = now - timedelta(hours=48)

    stale_orders = Order.objects.filter(
        status=Order.Status.PENDING,
        created_at__lt=cutoff,
    )
    cancelled_count = stale_orders.update(
        status=Order.Status.CANCELLED,
        updated_at=now,
    )

    summary = {"cancelled_orders": cancelled_count}
    logger.info(
        "expired_stale_pending_orders",
        extra={"cancelled_orders": cancelled_count, "cutoff": cutoff.isoformat()},
    )
    return summary
