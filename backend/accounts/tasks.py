import logging

from celery import shared_task
from django.db import models
from django.utils import timezone

from accounts.models import EmailVerificationToken, PasswordResetToken, PhoneVerification
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


@shared_task(
    bind=True,
    queue="sms",
    autoretry_for=(Exception,),
    retry_backoff=30,
    retry_kwargs={"max_retries": 3},
)
def send_phone_verification_sms(self, verification_id: int, code: str):
    try:
        verification = PhoneVerification.objects.get(id=verification_id)
    except PhoneVerification.DoesNotExist:
        logger.warning("phone_verification_not_found", extra={"verification_id": verification_id})
        return

    if verification.is_expired or verification.is_verified:
        logger.info(
            "phone_verification_skipped",
            extra={
                "verification_id": verification.id,
                "is_expired": verification.is_expired,
                "is_verified": verification.is_verified,
            },
        )
        return

    message = f"Your MilkVanq code is {code}"
    metadata = {
        "kind": "phone_verification",
        "verification_id": verification.id,
        "user_id": verification.user_id,
    }
    send_sms(verification.phone_number, message, metadata=metadata)
    logger.info(
        "phone_verification_sms_sent",
        extra={
            "verification_id": verification.id,
            "user_id": verification.user_id,
            "phone_number": verification.phone_number,
        },
    )


@shared_task
def cleanup_expired_phone_verifications():
    deleted_count = PhoneVerification.objects.cleanup_expired(now=timezone.now())
    logger.info("Cleaned up %s phone verification records", deleted_count)


@shared_task
def cleanup_password_reset_tokens():
    now = timezone.now()
    deleted_count, _ = PasswordResetToken.objects.filter(
        models.Q(expires_at__lte=now) | models.Q(used_at__isnull=False)
    ).delete()
    logger.info("Cleaned up %s password reset token(s)", deleted_count)
