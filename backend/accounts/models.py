import secrets
from datetime import timedelta

from django.conf import settings
from django.db import models
from django.utils import timezone


def default_phone_verification_expires_at():
    ttl_minutes = getattr(settings, "PHONE_VERIFICATION_TTL_MINUTES", 10)
    return timezone.now() + timedelta(minutes=ttl_minutes)


def default_email_verification_expires_at():
    return timezone.now() + timedelta(hours=24)


class EmailVerificationTokenManager(models.Manager):
    def create_for_user(self, user, expires_at=None):
        now = timezone.now()
        # Invalidate any active tokens for this user before creating a new one.
        self.filter(user=user, used_at__isnull=True, expires_at__gt=now).update(used_at=now)
        if expires_at is None:
            expires_at = now + timedelta(hours=24)
        return self.create(
            user=user,
            token=secrets.token_urlsafe(32),
            expires_at=expires_at,
        )


class CustomerProfile(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name="customer_profile",
        on_delete=models.CASCADE,
    )
    first_name = models.CharField(max_length=150, blank=True)
    last_name = models.CharField(max_length=150, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    address_line1 = models.CharField(max_length=255, blank=True)
    address_line2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    postal_code = models.CharField(max_length=20, blank=True)
    region_code = models.CharField(max_length=32, blank=True)
    email_verified_at = models.DateTimeField(null=True, blank=True)
    phone_verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["user__id"]

    def __str__(self) -> str:
        return f"CustomerProfile for {self.user_id}"


class EmailVerificationToken(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        related_name="email_verification_tokens",
        on_delete=models.CASCADE,
    )
    token = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=default_email_verification_expires_at)
    used_at = models.DateTimeField(null=True, blank=True)

    objects = EmailVerificationTokenManager()

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"EmailVerificationToken for {self.user_id}"

    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    def is_used(self) -> bool:
        return self.used_at is not None

    @property
    def is_active(self) -> bool:
        return not self.is_used() and not self.is_expired()

    def mark_used(self) -> None:
        if self.is_used():
            return
        self.used_at = timezone.now()
        self.save(update_fields=["used_at"])


class PhoneVerificationManager(models.Manager):
    def cleanup_expired(self, now=None) -> int:
        current_time = now or timezone.now()
        stale_verified_before = current_time - timedelta(days=30)
        qs = self.filter(
            models.Q(expires_at__lt=current_time) | models.Q(verified_at__lt=stale_verified_before)
        )
        deleted, _ = qs.delete()
        return deleted


class PhoneVerification(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="phone_verifications",
    )
    phone_number = models.CharField(max_length=32)
    code_hash = models.CharField(max_length=128)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(default=default_phone_verification_expires_at)
    verified_at = models.DateTimeField(null=True, blank=True)
    attempts = models.PositiveSmallIntegerField(default=0)

    objects = PhoneVerificationManager()

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "created_at"]),
        ]

    def __str__(self) -> str:
        return f"PhoneVerification for {self.user_id}"

    @staticmethod
    def default_expiry():
        return default_phone_verification_expires_at()

    @property
    def is_expired(self) -> bool:
        return timezone.now() >= self.expires_at

    @property
    def is_verified(self) -> bool:
        return self.verified_at is not None

    @property
    def is_locked(self) -> bool:
        max_attempts = getattr(settings, "PHONE_VERIFICATION_MAX_ATTEMPTS", 5)
        return self.attempts >= max_attempts
