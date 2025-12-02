from __future__ import annotations

import logging
from typing import Iterable, Optional, Sequence, Tuple

from celery import shared_task
from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.files.base import ContentFile
from django.core.mail import EmailMessage
from django.template.loader import render_to_string
from django.utils import timezone

from accounts.models import EmailVerificationToken
from orders.models import Order
from .models import EmailNotification
from .services import generate_order_receipt_pdf

logger = logging.getLogger(__name__)

EMAIL_VERIFICATION_KIND = "email_verification"
ORDER_RECEIPT_KIND = "order_receipt"
DELIVERY_ETA_KIND = "delivery_eta"
ORDER_DELIVERED_KIND = "order_delivered"

Attachment = Tuple[str, bytes, str]


def _send_email_message(
    subject: str,
    body_html: str,
    to_email: str,
    kind: str,
    order: Optional[Order] = None,
    *,
    body_text: str = "",
    attachments: Optional[Sequence[Attachment]] = None,
) -> EmailNotification:
    """
    Low-level email sender that records EmailNotification and logs outcomes.
    """
    notification = EmailNotification.objects.create(
        order=order,
        to_email=to_email or "",
        subject=subject,
        body_text=body_text or "",
        body_html=body_html,
        kind=kind,
        status=EmailNotification.STATUS_PENDING,
    )

    log_extra = {
        "kind": kind,
        "order_id": order.id if order else None,
        "notification_id": notification.id,
        "to": to_email,
    }

    if not to_email:
        notification.status = EmailNotification.STATUS_FAILED
        notification.error = "Missing recipient email"
        notification.save(update_fields=["status", "error", "updated_at"])
        logger.warning("email_send_failed", extra=log_extra)
        return notification

    attachments = list(attachments or [])

    try:
        email_message = EmailMessage(
            subject=subject,
            body=body_html,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[to_email],
        )
        email_message.content_subtype = "html"
        for attachment in attachments:
            email_message.attach(*attachment)

        try:
            notification.message_id = email_message.message().get("Message-ID", "")
        except Exception:
            notification.message_id = ""

        sent_count = email_message.send()
        notification.status = (
            EmailNotification.STATUS_SENT if sent_count else EmailNotification.STATUS_FAILED
        )
        notification.sent_at = timezone.now() if sent_count else None
        if not sent_count:
            notification.error = "Email backend did not send message"
        notification.save(
            update_fields=["status", "sent_at", "message_id", "error", "updated_at"]
        )

        if sent_count:
            logger.info("email_sent", extra=log_extra)
        else:
            logger.error("email_send_failed", extra=log_extra)

        return notification
    except Exception as exc:
        notification.status = EmailNotification.STATUS_FAILED
        notification.error = str(exc)
        notification.save(update_fields=["status", "error", "updated_at"])
        logger.error("email_send_failed", extra=log_extra, exc_info=True)
        return notification


def build_email_verification_url(token: str) -> str:
    base = getattr(settings, "EMAIL_VERIFICATION_BASE_URL", None)
    if not base:
        origins = getattr(settings, "FRONTEND_ORIGINS", [])
        if origins:
            base = origins[0]
    if not base:
        backend_host = getattr(settings, "BACKEND_HOST", "localhost")
        base = f"https://{backend_host}"
    return f"{base.rstrip('/')}/verify-email?token={token}"


def send_email_verification_email(user, token: str) -> Optional[EmailNotification]:
    if not user or not getattr(user, "email", None):
        logger.warning(
            "email_verification_missing_user_email",
            extra={"user_id": getattr(user, "id", None)},
        )
        return None

    verification_url = build_email_verification_url(token)
    context = {"user": user, "verification_url": verification_url}
    subject = "Verify your email address"
    body_text = render_to_string("notifications/email_verification_plain.txt", context)
    body_html = render_to_string("emails/email_verification.html", context)

    return _send_email_message(
        subject,
        body_html,
        user.email,
        EMAIL_VERIFICATION_KIND,
        body_text=body_text,
    )


def _format_eta_line(order: Order) -> str:
    if order.estimated_delivery_at:
        local_eta = timezone.localtime(order.estimated_delivery_at)
        return f"Your order is scheduled for delivery on {local_eta.strftime('%Y-%m-%d around %H:%M')}."
    return (
        "Your order has been scheduled for delivery. "
        "We will share a precise delivery window soon."
    )


def send_delivery_eta_email(order: Order) -> EmailNotification:
    subject = f"Delivery ETA for your order #{order.id}"

    if not order.email:
        return EmailNotification.objects.create(
            order=order,
            kind=DELIVERY_ETA_KIND,
            to_email="",
            subject=subject,
            body_text="",
            body_html="",
            status=EmailNotification.STATUS_FAILED,
            error="Order has no email address; ETA not sent.",
        )

    context = {
        "order": order,
        "greeting": order.full_name or "there",
        "eta_line": _format_eta_line(order),
    }
    body_text = render_to_string("emails/delivery_eta.txt", context)
    body_html = render_to_string("emails/delivery_eta.html", context)

    return _send_email_message(
        subject,
        body_html,
        order.email,
        DELIVERY_ETA_KIND,
        order=order,
        body_text=body_text,
    )


def send_order_receipt_email(order: Order) -> EmailNotification:
    subject = f"Your Meat Direct order #{order.id} receipt"

    if not order.email:
        return EmailNotification.objects.create(
            order=order,
            kind=ORDER_RECEIPT_KIND,
            to_email="",
            subject=subject,
            body_text="",
            body_html="",
            status=EmailNotification.STATUS_FAILED,
            error="Order has no email address; receipt not sent.",
        )

    context = {"order": order, "items": order.items.all()}
    body_text = render_to_string("emails/order_receipt.txt", context)
    body_html = render_to_string("emails/order_receipt.html", context)

    pdf_bytes = None
    pdf_error = ""
    try:
        pdf_bytes = generate_order_receipt_pdf(order)
    except Exception as exc:  # pragma: no cover - defensive
        pdf_error = f"PDF generation failed: {exc}"
        pdf_bytes = None

    attachments: Iterable[Attachment] = []
    filename = ""
    if pdf_bytes:
        filename = f"order-{order.id}-receipt.pdf"
        attachments = [(filename, pdf_bytes, "application/pdf")]

    notification = _send_email_message(
        subject,
        body_html,
        order.email,
        ORDER_RECEIPT_KIND,
        order=order,
        body_text=body_text,
        attachments=list(attachments),
    )

    if pdf_bytes and notification.status == EmailNotification.STATUS_SENT:
        notification.receipt_pdf.save(filename, ContentFile(pdf_bytes), save=False)
        notification.save(update_fields=["receipt_pdf", "updated_at"])

    if pdf_error:
        notification.error = (
            f"{notification.error}\n{pdf_error}".strip() if notification.error else pdf_error
        )
        notification.save(update_fields=["error", "updated_at"])

    return notification


def send_order_delivered_email(order: Order) -> EmailNotification:
    subject = f"Your order #{order.id} has been delivered"

    if not order.email:
        return EmailNotification.objects.create(
            order=order,
            kind=ORDER_DELIVERED_KIND,
            to_email="",
            subject=subject,
            body_text="",
            body_html="",
            status=EmailNotification.STATUS_FAILED,
            error="Order has no email address; delivered email not sent.",
        )

    delivered_at = order.delivered_at or timezone.now()
    context = {"order": order, "delivered_at": delivered_at, "greeting": order.full_name or "there"}
    body_text = render_to_string("emails/order_delivered.txt", context)
    body_html = render_to_string("emails/order_delivered.html", context)

    return _send_email_message(
        subject,
        body_html,
        order.email,
        ORDER_DELIVERED_KIND,
        order=order,
        body_text=body_text,
    )


@shared_task(queue="emails")
def send_email_verification_email_task(user_id: int, token: str) -> Optional[int]:
    """
    Send a verification email if the user and token are still valid.
    """
    User = get_user_model()
    user = User.objects.filter(id=user_id).first()
    if not user:
        logger.warning("email_verification_user_not_found", extra={"user_id": user_id})
        return None

    if not user.email:
        logger.warning(
            "email_verification_missing_email",
            extra={"user_id": user_id},
        )
        return None

    has_active_token = EmailVerificationToken.objects.filter(
        user=user,
        token=token,
        used_at__isnull=True,
        expires_at__gt=timezone.now(),
    ).exists()

    if not has_active_token:
        logger.warning(
            "email_verification_token_inactive",
            extra={"user_id": user_id},
        )
        return None

    notification = send_email_verification_email(user, token)
    return notification.id if notification else None


@shared_task(name="notifications.send_delivery_eta_email", queue="emails")
def send_delivery_eta_email_task(order_id: int) -> Optional[int]:
    order = Order.objects.filter(id=order_id).first()
    if not order:
        logger.warning("delivery_eta_order_not_found", extra={"order_id": order_id})
        return None

    if not order.email:
        logger.warning("delivery_eta_missing_email", extra={"order_id": order_id})
        return None

    notification = send_delivery_eta_email(order)
    return notification.id


@shared_task(name="notifications.send_order_receipt_email", queue="emails")
def send_order_receipt_email_once(order_id: int | Order) -> Optional[int]:
    order = order_id if isinstance(order_id, Order) else Order.objects.filter(id=order_id).first()
    if not order:
        logger.warning("order_receipt_order_not_found", extra={"order_id": order_id})
        return None

    if not order.email:
        logger.warning("order_receipt_missing_email", extra={"order_id": order.id})
        return None

    existing = (
        EmailNotification.objects.filter(
            order=order, kind=ORDER_RECEIPT_KIND, status=EmailNotification.STATUS_SENT
        )
        .order_by("-sent_at", "-created_at")
        .first()
    )
    if existing:
        logger.info(
            "order_receipt_already_sent",
            extra={"order_id": order.id, "notification_id": existing.id},
        )
        return existing.id

    notification = send_order_receipt_email(order)
    return notification.id


@shared_task(queue="emails")
def send_order_delivered_email_once(order_id: int | Order) -> Optional[int]:
    order = order_id if isinstance(order_id, Order) else Order.objects.filter(id=order_id).first()
    if not order:
        logger.warning("order_delivered_order_not_found", extra={"order_id": order_id})
        return None

    if not order.email:
        logger.warning("order_delivered_missing_email", extra={"order_id": order.id})
        return None

    existing = (
        EmailNotification.objects.filter(
            order=order, kind=ORDER_DELIVERED_KIND, status=EmailNotification.STATUS_SENT
        )
        .order_by("-sent_at", "-created_at")
        .first()
    )
    if existing:
        logger.info(
            "order_delivered_already_sent",
            extra={"order_id": order.id, "notification_id": existing.id},
        )
        return existing.id

    notification = send_order_delivered_email(order)
    return notification.id


send_order_receipt_email_task = send_order_receipt_email_once
send_order_delivered_email_task = send_order_delivered_email_once
