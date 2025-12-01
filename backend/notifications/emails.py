from django.conf import settings
from django.core.files.base import ContentFile
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone

from orders.models import Order

from .models import EmailNotification
from .services import generate_order_receipt_pdf

ORDER_RECEIPT_KIND = "order_receipt"


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


def send_email_verification_email(user, token: str) -> None:
    subject = "Verify your email address"
    verification_url = build_email_verification_url(token)
    context = {"user": user, "verification_url": verification_url}

    text_body = render_to_string("notifications/email_verification_plain.txt", context)
    html_body = render_to_string("notifications/email_verification.html", context)

    msg = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[user.email],
    )
    msg.attach_alternative(html_body, "text/html")
    msg.send()


def _render_receipt_bodies(order: Order) -> tuple[str, str]:
    context = {"order": order, "items": order.items.all()}
    text_body = render_to_string("emails/order_receipt.txt", context)
    html_body = render_to_string("emails/order_receipt.html", context)
    return text_body, html_body


def send_order_receipt_email(order: Order) -> EmailNotification:
    """
    Low-level send that always records an EmailNotification attempt (pending -> sent/failed).
    """
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

    text_body, html_body = _render_receipt_bodies(order)
    notification = EmailNotification.objects.create(
        order=order,
        kind=ORDER_RECEIPT_KIND,
        to_email=order.email,
        subject=subject,
        body_text=text_body,
        body_html=html_body,
        status=EmailNotification.STATUS_PENDING,
    )

    from_email = settings.DEFAULT_FROM_EMAIL
    pdf_bytes = None
    pdf_error = ""
    try:
        try:
            pdf_bytes = generate_order_receipt_pdf(order)
        except Exception as exc:  # pragma: no cover - defensive
            pdf_bytes = None
            pdf_error = f"PDF generation failed: {exc}"

        msg = EmailMultiAlternatives(
            subject,
            text_body,
            from_email,
            [order.email],
        )
        msg.attach_alternative(html_body, "text/html")
        if pdf_bytes:
            msg.attach(
                f"order-{order.id}-receipt.pdf",
                pdf_bytes,
                "application/pdf",
            )

        try:
            notification.message_id = msg.message().get("Message-ID", "")
        except Exception:
            notification.message_id = ""

        sent_count = msg.send()
        notification.status = (
            EmailNotification.STATUS_SENT if sent_count else EmailNotification.STATUS_FAILED
        )
        notification.sent_at = timezone.now() if sent_count else None
        if not sent_count:
            notification.error = "Email backend did not send message"
        if pdf_error:
            notification.error = (
                f"{notification.error}\n{pdf_error}".strip()
                if notification.error
                else pdf_error
            )
        if pdf_bytes:
            notification.receipt_pdf.save(
                f"order-{order.id}-receipt.pdf",
                ContentFile(pdf_bytes),
                save=False,
            )
        notification.save(
            update_fields=[
                "status",
                "sent_at",
                "message_id",
                "error",
                "receipt_pdf",
                "updated_at",
            ]
        )
        return notification
    except Exception as exc:  # pragma: no cover - defensive
        notification.status = EmailNotification.STATUS_FAILED
        notification.error = str(exc)
        notification.save(update_fields=["status", "error", "updated_at"])
        return notification


def send_order_receipt_email_once(order: Order) -> EmailNotification:
    """
    Idempotent wrapper: return existing pending/sent notification, otherwise send.
    """
    existing = (
        EmailNotification.objects.filter(
            order=order,
            kind=ORDER_RECEIPT_KIND,
            status__in=[EmailNotification.STATUS_PENDING, EmailNotification.STATUS_SENT],
        )
        .order_by("-sent_at", "-created_at")
        .first()
    )
    if existing:
        return existing

    return send_order_receipt_email(order)
