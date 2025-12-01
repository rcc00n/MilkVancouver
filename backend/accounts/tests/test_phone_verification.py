import random
from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import make_password
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import CustomerProfile, PhoneVerification
from accounts.tasks import cleanup_expired_phone_verifications, send_phone_verification_sms


User = get_user_model()


class PhoneVerificationModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="model@example.com", email="model@example.com", password="password123"
        )

    def test_is_expired(self):
        past = PhoneVerification.objects.create(
            user=self.user,
            phone_number="+10000000000",
            code_hash="hash",
            expires_at=timezone.now() - timedelta(minutes=1),
        )
        future = PhoneVerification.objects.create(
            user=self.user,
            phone_number="+10000000001",
            code_hash="hash",
            expires_at=timezone.now() + timedelta(minutes=5),
        )

        self.assertTrue(past.is_expired)
        self.assertFalse(future.is_expired)

    def test_is_locked(self):
        max_attempts = getattr(self.settings, "PHONE_VERIFICATION_MAX_ATTEMPTS", 5)
        below = PhoneVerification.objects.create(
            user=self.user,
            phone_number="+10000000002",
            code_hash="hash",
            expires_at=timezone.now() + timedelta(minutes=5),
            attempts=max_attempts - 1,
        )
        at_limit = PhoneVerification.objects.create(
            user=self.user,
            phone_number="+10000000003",
            code_hash="hash",
            expires_at=timezone.now() + timedelta(minutes=5),
            attempts=max_attempts,
        )

        self.assertFalse(below.is_locked)
        self.assertTrue(at_limit.is_locked)

    def test_cleanup_expired_removes_old_records(self):
        now = timezone.now()
        expired = PhoneVerification.objects.create(
            user=self.user,
            phone_number="+10000000004",
            code_hash="hash",
            expires_at=now - timedelta(minutes=1),
        )
        verified_old = PhoneVerification.objects.create(
            user=self.user,
            phone_number="+10000000005",
            code_hash="hash",
            expires_at=now + timedelta(minutes=5),
            verified_at=now - timedelta(days=31),
        )
        active = PhoneVerification.objects.create(
            user=self.user,
            phone_number="+10000000006",
            code_hash="hash",
            expires_at=now + timedelta(minutes=5),
        )

        deleted_count = PhoneVerification.objects.cleanup_expired(now=now)

        self.assertEqual(deleted_count, 2)
        remaining_ids = set(PhoneVerification.objects.values_list("id", flat=True))
        self.assertNotIn(expired.id, remaining_ids)
        self.assertNotIn(verified_old.id, remaining_ids)
        self.assertIn(active.id, remaining_ids)


class PhoneVerificationTaskTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="task@example.com", email="task@example.com", password="password123"
        )

    @patch("accounts.tasks.send_sms")
    def test_send_phone_verification_sms_calls_send_sms_when_active(self, mock_send_sms):
        verification = PhoneVerification.objects.create(
            user=self.user,
            phone_number="+15550000000",
            code_hash="hash",
            expires_at=timezone.now() + timedelta(minutes=5),
        )

        send_phone_verification_sms(verification.id, "123456")

        mock_send_sms.assert_called_once_with("+15550000000", "Your MilkVanq code is 123456")

    @patch("accounts.tasks.send_sms")
    def test_send_phone_verification_sms_skips_when_invalid(self, mock_send_sms):
        expired = PhoneVerification.objects.create(
            user=self.user,
            phone_number="+15550000001",
            code_hash="hash",
            expires_at=timezone.now() - timedelta(minutes=1),
        )
        verified = PhoneVerification.objects.create(
            user=self.user,
            phone_number="+15550000002",
            code_hash="hash",
            expires_at=timezone.now() + timedelta(minutes=5),
            verified_at=timezone.now(),
        )

        send_phone_verification_sms(expired.id, "123456")
        send_phone_verification_sms(verified.id, "123456")

        mock_send_sms.assert_not_called()

    def test_cleanup_expired_phone_verifications_task(self):
        now = timezone.now()
        expired = PhoneVerification.objects.create(
            user=self.user,
            phone_number="+15550000003",
            code_hash="hash",
            expires_at=now - timedelta(minutes=1),
        )
        active = PhoneVerification.objects.create(
            user=self.user,
            phone_number="+15550000004",
            code_hash="hash",
            expires_at=now + timedelta(minutes=5),
        )
        verified_old = PhoneVerification.objects.create(
            user=self.user,
            phone_number="+15550000005",
            code_hash="hash",
            expires_at=now + timedelta(minutes=5),
            verified_at=now - timedelta(days=40),
            created_at=now - timedelta(days=40),
        )

        cleanup_expired_phone_verifications()

        remaining = PhoneVerification.objects.all()
        remaining_ids = set(remaining.values_list("id", flat=True))
        self.assertNotIn(expired.id, remaining_ids)
        self.assertNotIn(verified_old.id, remaining_ids)
        self.assertIn(active.id, remaining_ids)


class PhoneVerificationAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="api@example.com", email="api@example.com", password="password123"
        )
        self.profile = CustomerProfile.objects.get(user=self.user)
        self.request_url = reverse("request-phone-verification")
        self.verify_url = reverse("verify-phone")
        self.client.login(username=self.user.username, password="password123")

    @patch("accounts.serializers.send_phone_verification_sms.delay")
    @patch("accounts.serializers.random.randint", return_value=123456)
    def test_request_phone_verification_happy_path(self, mock_randint, mock_delay):
        payload = {"phone_number": "+12223334444"}
        response = self.client.post(self.request_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.json(), {"detail": "Verification code sent via SMS."})

        verification = PhoneVerification.objects.get(user=self.user)
        self.assertEqual(verification.phone_number, payload["phone_number"])
        self.assertTrue(verification.code_hash)
        mock_delay.assert_called_once_with(verification.id, "123456")
        mock_randint.assert_called_once()

    @patch("accounts.serializers.send_phone_verification_sms.delay")
    @patch("accounts.serializers.random.randint", return_value=654321)
    def test_request_phone_verification_uses_profile_phone(self, mock_randint, mock_delay):
        self.profile.phone = "+19998887777"
        self.profile.save()

        response = self.client.post(self.request_url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        verification = PhoneVerification.objects.get(user=self.user)
        self.assertEqual(verification.phone_number, "+19998887777")
        mock_delay.assert_called_once_with(verification.id, "654321")

    def test_request_phone_verification_missing_phone(self):
        self.profile.phone = ""
        self.profile.save()

        response = self.client.post(self.request_url, {}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Phone number is required.", str(response.data))

    @patch("accounts.serializers.send_phone_verification_sms.delay")
    @patch("accounts.serializers.random.randint", return_value=111111)
    def test_request_phone_verification_daily_limit(self, mock_randint, mock_delay):
        max_per_day = getattr(self.settings, "PHONE_VERIFICATION_MAX_PER_DAY", 3)
        for _ in range(max_per_day):
            PhoneVerification.objects.create(
                user=self.user,
                phone_number="+10000000000",
                code_hash="hash",
                expires_at=timezone.now() + timedelta(minutes=5),
            )

        response = self.client.post(self.request_url, {"phone_number": "+10000000001"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("daily phone verification limit", str(response.data))
        mock_delay.assert_not_called()
        mock_randint.assert_not_called()

    def test_verify_phone_happy_path(self):
        verification = PhoneVerification.objects.create(
            user=self.user,
            phone_number="+12223334444",
            code_hash=make_password("123456"),
            expires_at=timezone.now() + timedelta(minutes=5),
        )

        response = self.client.post(self.verify_url, {"code": "123456"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {"detail": "Phone number verified successfully."})

        verification.refresh_from_db()
        self.assertIsNotNone(verification.verified_at)
        self.assertEqual(verification.attempts, 1)

        self.profile.refresh_from_db()
        self.assertEqual(self.profile.phone, verification.phone_number)
        self.assertIsNotNone(self.profile.phone_verified_at)

    def test_verify_phone_no_active_verification(self):
        expired = PhoneVerification.objects.create(
            user=self.user,
            phone_number="+12223334444",
            code_hash=make_password("123456"),
            expires_at=timezone.now() - timedelta(minutes=1),
        )

        response = self.client.post(self.verify_url, {"code": "123456"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("No active verification code found", str(response.data))

        expired.refresh_from_db()
        self.assertIsNone(expired.verified_at)

    def test_verify_phone_incorrect_code_increments_attempts_and_locks(self):
        max_attempts = getattr(self.settings, "PHONE_VERIFICATION_MAX_ATTEMPTS", 5)
        verification = PhoneVerification.objects.create(
            user=self.user,
            phone_number="+12223334444",
            code_hash=make_password("123456"),
            expires_at=timezone.now() + timedelta(minutes=5),
            attempts=max_attempts - 1,
        )

        wrong_response = self.client.post(self.verify_url, {"code": "000000"}, format="json")
        self.assertEqual(wrong_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Incorrect code", str(wrong_response.data))

        verification.refresh_from_db()
        self.assertEqual(verification.attempts, max_attempts)
        self.assertIsNone(verification.verified_at)

        lock_response = self.client.post(self.verify_url, {"code": "000000"}, format="json")
        self.assertEqual(lock_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("Too many incorrect attempts", str(lock_response.data))

        verification.refresh_from_db()
        self.assertEqual(verification.attempts, max_attempts)
        self.assertIsNone(verification.verified_at)

    def test_verify_phone_expired_treated_as_no_active(self):
        PhoneVerification.objects.create(
            user=self.user,
            phone_number="+12223334444",
            code_hash=make_password("123456"),
            expires_at=timezone.now() - timedelta(minutes=1),
        )

        response = self.client.post(self.verify_url, {"code": "123456"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("No active verification code found", str(response.data))

    def test_verify_phone_expires_other_active_codes_on_success(self):
        now = timezone.now()
        older = PhoneVerification.objects.create(
            user=self.user,
            phone_number="+12223334444",
            code_hash=make_password("999999"),
            expires_at=now + timedelta(minutes=10),
        )
        newer = PhoneVerification.objects.create(
            user=self.user,
            phone_number="+12223334444",
            code_hash=make_password("123456"),
            expires_at=now + timedelta(minutes=10),
        )
        PhoneVerification.objects.filter(id=older.id).update(created_at=now - timedelta(minutes=5))

        response = self.client.post(self.verify_url, {"code": "123456"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        newer.refresh_from_db()
        self.assertIsNotNone(newer.verified_at)

        older.refresh_from_db()
        self.assertLessEqual(older.expires_at, timezone.now())
        self.assertIsNone(older.verified_at)
