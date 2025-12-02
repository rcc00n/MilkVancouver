from notifications import tasks as task_helpers
from notifications.models import EmailNotification

DELIVERY_ETA_KIND = task_helpers.DELIVERY_ETA_KIND
EMAIL_VERIFICATION_KIND = task_helpers.EMAIL_VERIFICATION_KIND
ORDER_DELIVERED_KIND = task_helpers.ORDER_DELIVERED_KIND
ORDER_RECEIPT_KIND = task_helpers.ORDER_RECEIPT_KIND


def build_email_verification_url(token: str) -> str:
    return task_helpers.build_email_verification_url(token)


def send_email_verification_email(user, token: str):
    return task_helpers.send_email_verification_email(user, token)


def send_delivery_eta_email(order):
    return task_helpers.send_delivery_eta_email(order)


def send_order_receipt_email(order):
    return task_helpers.send_order_receipt_email(order)


def send_order_receipt_email_once(order):
    notification_id = task_helpers.send_order_receipt_email_once(
        getattr(order, "id", order)
    )
    if notification_id is None:
        return None
    return EmailNotification.objects.filter(id=notification_id).first()


def send_order_delivered_email(order):
    return task_helpers.send_order_delivered_email(order)


def send_order_delivered_email_once(order):
    notification_id = task_helpers.send_order_delivered_email_once(
        getattr(order, "id", order)
    )
    if notification_id is None:
        return None
    return EmailNotification.objects.filter(id=notification_id).first()

__all__ = [
    "DELIVERY_ETA_KIND",
    "EMAIL_VERIFICATION_KIND",
    "ORDER_DELIVERED_KIND",
    "ORDER_RECEIPT_KIND",
    "build_email_verification_url",
    "send_delivery_eta_email",
    "send_email_verification_email",
    "send_order_delivered_email",
    "send_order_delivered_email_once",
    "send_order_receipt_email",
    "send_order_receipt_email_once",
]
