import pytest
from datetime import timedelta
from uuid import uuid4

from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password, make_password
from django.core import mail
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework.test import APIClient

from accounts.models import CustomerProfile, EmailVerificationToken, PhoneVerification
from notifications.emails import send_email_verification_email
from notifications.tasks import send_email_verification_email_task

pytestmark = pytest.mark.django_db


@pytest.fixture
def user():
    user_model = get_user_model()
    email = f"user-{uuid4().hex[:8]}@example.com"
    user = user_model.objects.create_user(username=email, email=email, password="password123")
    CustomerProfile.objects.get_or_create(user=user)
    return user


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def auth_client(user):
    client = APIClient()
    client.force_authenticate(user=user)
    return client


@pytest.fixture
def locmem_email_backend():
    with override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend"):
        mail.get_connection()
        if not hasattr(mail, "outbox"):
            mail.outbox = []
        else:
            mail.outbox.clear()
        yield
        if hasattr(mail, "outbox"):
            mail.outbox.clear()


def test_email_token_generation_and_invalidation(user):
    first = EmailVerificationToken.objects.create_for_user(user)
    second = EmailVerificationToken.objects.create_for_user(user)

    first.refresh_from_db()
    second.refresh_from_db()

    assert first.used_at is not None
    assert second.expires_at > timezone.now()
    assert second.is_active


def test_email_token_expiry_and_active_state(user):
    expired = EmailVerificationToken.objects.create(
        user=user,
        token="expired-token",
        expires_at=timezone.now() - timedelta(minutes=1),
    )

    assert expired.is_expired()
    assert not expired.is_active


def test_send_verification_email_uses_locmem_backend(user, locmem_email_backend):
    token = EmailVerificationToken.objects.create_for_user(user)

    send_email_verification_email(user, token.token)

    assert len(mail.outbox) == 1
    message = mail.outbox[0]
    assert message.to == [user.email]
    assert "verify" in message.subject.lower()


def test_verify_email_endpoint_happy_path(user, api_client):
    active_token = EmailVerificationToken.objects.create(
        user=user,
        token=f"active-{uuid4().hex}",
        expires_at=timezone.now() + timedelta(hours=1),
    )
    other_active = EmailVerificationToken.objects.create(
        user=user,
        token=f"other-{uuid4().hex}",
        expires_at=timezone.now() + timedelta(hours=1),
    )

    response = api_client.get(reverse("verify-email"), {"token": active_token.token})

    assert response.status_code == 200
    assert response.json() == {"detail": "Email verified successfully."}

    active_token.refresh_from_db()
    assert active_token.is_used()

    profile = CustomerProfile.objects.get(user=user)
    assert profile.email_verified_at is not None

    other_active.refresh_from_db()
    assert other_active.is_used()


def test_verify_email_endpoint_expired_and_used_tokens(user, api_client):
    expired_token = EmailVerificationToken.objects.create(
        user=user,
        token=f"expired-{uuid4().hex}",
        expires_at=timezone.now() - timedelta(minutes=1),
    )
    used_token = EmailVerificationToken.objects.create(
        user=user,
        token=f"used-{uuid4().hex}",
        expires_at=timezone.now() + timedelta(hours=1),
        used_at=timezone.now(),
    )

    expired_response = api_client.get(reverse("verify-email"), {"token": expired_token.token})
    assert expired_response.status_code == 400
    assert expired_response.json()["detail"] == "Token has expired."

    used_response = api_client.get(reverse("verify-email"), {"token": used_token.token})
    assert used_response.status_code == 400
    assert used_response.json()["detail"] == "Token has already been used."


def test_verify_email_endpoint_cannot_be_reused(user, api_client):
    token = EmailVerificationToken.objects.create(
        user=user,
        token=f"single-use-{uuid4().hex}",
        expires_at=timezone.now() + timedelta(hours=1),
    )

    first_response = api_client.get(reverse("verify-email"), {"token": token.token})
    assert first_response.status_code == 200

    second_response = api_client.get(reverse("verify-email"), {"token": token.token})
    assert second_response.status_code == 400
    assert second_response.json()["detail"] == "Token has already been used."


def test_email_verification_task_sends_only_for_active_token(user, locmem_email_backend):
    active_token = EmailVerificationToken.objects.create(
        user=user,
        token=f"task-{uuid4().hex}",
        expires_at=timezone.now() + timedelta(hours=1),
    )

    send_email_verification_email_task(user.id, active_token.token)

    assert len(mail.outbox) == 1
    assert mail.outbox[0].to == [user.email]

    mail.outbox.clear()
    active_token.used_at = timezone.now()
    active_token.save(update_fields=["used_at"])

    send_email_verification_email_task(user.id, active_token.token)

    assert len(mail.outbox) == 0


def test_request_phone_verification_generates_hashed_code_and_sends_sms(
    user, auth_client, monkeypatch
):
    profile = CustomerProfile.objects.get(user=user)
    profile.phone = "+15550000001"
    profile.save(update_fields=["phone"])

    monkeypatch.setattr("accounts.serializers.random.randint", lambda *_, **__: 123456)
    sent_payload = {}

    def fake_delay(verification_id, code):
        sent_payload["call"] = (verification_id, code)

    monkeypatch.setattr("accounts.serializers.send_phone_verification_sms.delay", fake_delay)

    response = auth_client.post(reverse("request-phone-verification"), {}, format="json")

    assert response.status_code == 201
    verification = PhoneVerification.objects.filter(user=user).first()
    assert verification is not None
    assert verification.phone_number == profile.phone
    assert check_password("123456", verification.code_hash)
    assert verification.expires_at > timezone.now()
    assert verification.attempts == 0
    assert sent_payload["call"] == (verification.id, "123456")


def test_verify_phone_with_correct_code_updates_profile(user, auth_client):
    verification = PhoneVerification.objects.create(
        user=user,
        phone_number="+12223334444",
        code_hash=make_password("999999"),
        expires_at=timezone.now() + timedelta(minutes=5),
    )

    response = auth_client.post(reverse("verify-phone"), {"code": "999999"}, format="json")

    assert response.status_code == 200
    assert response.json() == {"detail": "Phone number verified successfully."}

    verification.refresh_from_db()
    assert verification.verified_at is not None
    assert verification.attempts == 1

    profile = CustomerProfile.objects.get(user=user)
    assert profile.phone == verification.phone_number
    assert profile.phone_verified_at is not None


def test_verify_phone_incorrect_code_and_lockout(user, auth_client):
    max_attempts = getattr(settings, "PHONE_VERIFICATION_MAX_ATTEMPTS", 5)
    verification = PhoneVerification.objects.create(
        user=user,
        phone_number="+14445556666",
        code_hash=make_password("111111"),
        expires_at=timezone.now() + timedelta(minutes=5),
        attempts=max_attempts - 1,
    )

    wrong_response = auth_client.post(reverse("verify-phone"), {"code": "000000"}, format="json")
    assert wrong_response.status_code == 400
    assert "Incorrect code" in str(wrong_response.data)

    verification.refresh_from_db()
    assert verification.attempts == max_attempts
    assert verification.verified_at is None

    locked_response = auth_client.post(reverse("verify-phone"), {"code": "000000"}, format="json")
    assert locked_response.status_code == 400
    assert "Too many incorrect attempts" in str(locked_response.data)

    verification.refresh_from_db()
    assert verification.attempts == max_attempts
    assert verification.verified_at is None


def test_daily_rate_limit_for_phone_verification(user, auth_client, monkeypatch):
    monkeypatch.setattr("accounts.serializers.random.randint", lambda *_, **__: 555555)
    call_tracker = {"called": False}

    def fake_delay(*args, **kwargs):
        call_tracker["called"] = True

    monkeypatch.setattr("accounts.serializers.send_phone_verification_sms.delay", fake_delay)

    max_per_day = getattr(settings, "PHONE_VERIFICATION_MAX_PER_DAY", 3)
    for _ in range(max_per_day):
        PhoneVerification.objects.create(
            user=user,
            phone_number="+10000000000",
            code_hash=make_password("123456"),
            expires_at=timezone.now() + timedelta(minutes=5),
        )

    response = auth_client.post(
        reverse("request-phone-verification"), {"phone_number": "+19998887777"}, format="json"
    )

    assert response.status_code == 400
    assert "daily phone verification limit" in str(response.data).lower()
    assert call_tracker["called"] is False


def test_cleanup_expired_phone_verifications_removes_only_expired_and_stale(user):
    now = timezone.now()
    expired = PhoneVerification.objects.create(
        user=user,
        phone_number="+10000000001",
        code_hash=make_password("222222"),
        expires_at=now - timedelta(minutes=1),
    )
    stale_verified = PhoneVerification.objects.create(
        user=user,
        phone_number="+10000000002",
        code_hash=make_password("333333"),
        expires_at=now + timedelta(minutes=5),
        verified_at=now - timedelta(days=40),
    )
    recent_verified = PhoneVerification.objects.create(
        user=user,
        phone_number="+10000000003",
        code_hash=make_password("444444"),
        expires_at=now + timedelta(minutes=5),
        verified_at=now - timedelta(days=5),
    )
    active = PhoneVerification.objects.create(
        user=user,
        phone_number="+10000000004",
        code_hash=make_password("555555"),
        expires_at=now + timedelta(minutes=5),
    )

    deleted = PhoneVerification.objects.cleanup_expired(now=now)

    remaining_ids = set(PhoneVerification.objects.values_list("id", flat=True))
    assert deleted == 2
    assert expired.id not in remaining_ids
    assert stale_verified.id not in remaining_ids
    assert recent_verified.id in remaining_ids
    assert active.id in remaining_ids
