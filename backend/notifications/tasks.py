from __future__ import annotations

from celery import shared_task

from orders.models import Order
from .emails import send_order_receipt_email_once
from .models import EmailNotification


@shared_task(name="notifications.send_order_receipt_email", queue="emails")
def send_order_receipt_email_task(order_id: int) -> int | None:
    """
    Enqueueable task to send an order receipt email.
    Returns the EmailNotification id if created, otherwise None.
    """
    order = Order.objects.filter(id=order_id).first()
    if not order:
        return None

    notification: EmailNotification = send_order_receipt_email_once(order)
    return notification.id
