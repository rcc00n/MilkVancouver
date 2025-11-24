from typing import Optional

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone

from orders.models import Order

from .models import EmailNotification
from .services import generate_order_receipt_pdf

ORDER_RECEIPT_KIND = "order_receipt"


def send_order_receipt_email(order: Order) -> EmailNotification:
    """
    Send an order receipt email with a PDF attachment to order.email.
    Create an EmailNotification row recording the attempt and result.
    If order.email is empty, do nothing and return a Notification with status='failed'.
    """
    subject = f"Your Meat Direct order #{order.id} receipt"

    if not order.email:
        return EmailNotification.objects.create(
            order=order,
            kind=ORDER_RECEIPT_KIND,
            to_email="",
            subject=subject,
            status="failed",
            error="Order has no email address; receipt not sent.",
        )

    context = {"order": order, "items": order.items.all()}
    text_body = render_to_string(
        "notifications/order_receipt_plain.txt", context
    )
    html_body = render_to_string(
        "notifications/order_receipt.html", context
    )

    from_email = settings.DEFAULT_FROM_EMAIL

    try:
        msg = EmailMultiAlternatives(
            subject,
            text_body,
            from_email,
            [order.email],
        )
        msg.attach_alternative(html_body, "text/html")

        pdf_bytes = generate_order_receipt_pdf(order)
        msg.attach("order_receipt.pdf", pdf_bytes, "application/pdf")

        message_id: Optional[str] = None
        try:
            message_id = msg.message().get("Message-ID")
        except Exception:
            message_id = None

        sent_count = msg.send()
        status = "sent" if sent_count else "failed"
        sent_at = timezone.now() if sent_count else None
        error = "" if sent_count else "Email backend did not send message"

        notification = EmailNotification.objects.create(
            order=order,
            kind=ORDER_RECEIPT_KIND,
            to_email=order.email,
            subject=subject,
            status=status,
            message_id=message_id or "",
            error=error,
            sent_at=sent_at,
        )
        if pdf_bytes and status == "sent":
            filename = f"order_{order.id}_receipt.pdf"
            notification.receipt_pdf.save(
                filename,
                ContentFile(pdf_bytes),
                save=True,
            )
        return notification
    except Exception as exc:
        return EmailNotification.objects.create(
            order=order,
            kind=ORDER_RECEIPT_KIND,
            to_email=order.email,
            subject=subject,
            status="failed",
            error=str(exc),
        )


def send_order_receipt_email_once(order: Order) -> EmailNotification:
    """
    Send the order receipt email only if one hasn't been successfully sent before
    for this order (kind='order_receipt' and status='sent').
    """
    existing = (
        EmailNotification.objects.filter(
            order=order, kind=ORDER_RECEIPT_KIND, status="sent"
        )
        .order_by("-sent_at", "-created_at")
        .first()
    )
    if existing:
        return existing

    return send_order_receipt_email(order)
