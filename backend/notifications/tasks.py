from __future__ import annotations

from django.contrib.auth import get_user_model
from django.utils import timezone
from celery import shared_task

from accounts.models import EmailVerificationToken
from orders.models import Order
from .emails import (
    send_delivery_eta_email,
    send_email_verification_email,
    send_order_receipt_email_once,
)
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


@shared_task(name="notifications.send_delivery_eta_email", queue="emails")
def send_delivery_eta_email_task(order_id: int) -> int | None:
    """
    Enqueueable task to send a delivery ETA email for a given order.
    Returns the EmailNotification id or None if the order does not exist.
    """
    order = Order.objects.filter(id=order_id).first()
    if not order:
        return None

    notification: EmailNotification = send_delivery_eta_email(order)
    return notification.id


@shared_task(queue="emails")
def send_email_verification_email_task(user_id: int, token: str) -> None:
    """
    Send a verification email if the user and token are still valid.
    """
    User = get_user_model()
    user = User.objects.filter(id=user_id).first()
    if not user:
        return None

    has_active_token = EmailVerificationToken.objects.filter(
        user=user,
        token=token,
        used_at__isnull=True,
        expires_at__gt=timezone.now(),
    ).exists()

    if not has_active_token:
        return None

    send_email_verification_email(user, token)
