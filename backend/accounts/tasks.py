import logging

from celery import shared_task
from django.db import models
from django.utils import timezone

from accounts.models import EmailVerificationToken, PhoneVerification
from sms.services import send_sms

logger = logging.getLogger(__name__)


@shared_task
def cleanup_email_verification_tokens():
    """
    Remove tokens that are expired or already used.
    """
    now = timezone.now()
    EmailVerificationToken.objects.filter(
        models.Q(expires_at__lte=now) | models.Q(used_at__isnull=False)
    ).delete()


@shared_task(queue="sms")
def send_phone_verification_sms(verification_id: int, code: str):
    try:
        verification = PhoneVerification.objects.get(id=verification_id)
    except PhoneVerification.DoesNotExist:
        return

    if verification.is_expired or verification.is_verified:
        return

    message = f"Your MilkVanq code is {code}"
    send_sms(verification.phone_number, message)
    logger.info("Sent phone verification SMS for verification_id=%s", verification_id)


@shared_task
def cleanup_expired_phone_verifications():
    deleted_count = PhoneVerification.objects.cleanup_expired(now=timezone.now())
    logger.info("Cleaned up %s phone verification records", deleted_count)
