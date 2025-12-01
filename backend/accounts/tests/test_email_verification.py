from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from django.test import TestCase
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import CustomerProfile, EmailVerificationToken
from accounts.tasks import cleanup_email_verification_tokens

User = get_user_model()


class EmailVerificationTokenModelTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="model@example.com",
            email="model@example.com",
            password="password123",
        )

    def test_create_for_user_invalidates_old_active_tokens(self):
        first = EmailVerificationToken.objects.create_for_user(self.user)
        second = EmailVerificationToken.objects.create_for_user(self.user)

        first.refresh_from_db()
        self.assertIsNotNone(first.used_at)
        self.assertFalse(second.is_used())
        self.assertEqual(second.user, self.user)

    def test_expires_at_set_in_future(self):
        token = EmailVerificationToken.objects.create_for_user(self.user)
        self.assertGreater(token.expires_at, timezone.now())

    def test_is_expired_and_is_used(self):
        expired = EmailVerificationToken.objects.create(
            user=self.user,
            token="expired-token",
            expires_at=timezone.now() - timedelta(minutes=1),
        )
        used = EmailVerificationToken.objects.create(
            user=self.user,
            token="used-token",
            expires_at=timezone.now() + timedelta(hours=1),
            used_at=timezone.now(),
        )

        self.assertTrue(expired.is_expired())
        self.assertFalse(expired.is_used())
        self.assertFalse(used.is_expired())
        self.assertTrue(used.is_used())

    def test_mark_used_sets_used_at(self):
        token = EmailVerificationToken.objects.create_for_user(self.user)
        self.assertIsNone(token.used_at)
        token.mark_used()
        token.refresh_from_db()
        self.assertIsNotNone(token.used_at)

    def test_cleanup_task_removes_expired_or_used_tokens(self):
        valid = EmailVerificationToken.objects.create(
            user=self.user,
            token="valid-token",
            expires_at=timezone.now() + timedelta(hours=1),
        )
        expired = EmailVerificationToken.objects.create(
            user=self.user,
            token="expired-token",
            expires_at=timezone.now() - timedelta(hours=1),
        )
        used = EmailVerificationToken.objects.create(
            user=self.user,
            token="used-token",
            expires_at=timezone.now() + timedelta(hours=1),
            used_at=timezone.now(),
        )

        cleanup_email_verification_tokens()

        remaining_tokens = EmailVerificationToken.objects.all()
        self.assertEqual(remaining_tokens.count(), 1)
        self.assertEqual(remaining_tokens.first().id, valid.id)
        self.assertFalse(remaining_tokens.first().is_used())
        self.assertFalse(remaining_tokens.first().is_expired())


class EmailVerificationAPITests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="api@example.com",
            email="api@example.com",
            password="password123",
        )
        self.profile = CustomerProfile.objects.get(user=self.user)
        self.request_url = reverse("request-email-verification")
        self.verify_url = reverse("verify-email")

    def test_request_email_verification_requires_auth(self):
        response = self.client.post(self.request_url)
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    @patch("accounts.api.send_email_verification_email_task.delay")
    def test_request_email_verification_creates_token_and_enqueues(self, mock_delay):
        self.client.login(username=self.user.username, password="password123")

        response = self.client.post(self.request_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {"detail": "Verification email sent."})
        token = EmailVerificationToken.objects.filter(user=self.user, used_at__isnull=True).first()
        self.assertIsNotNone(token)
        mock_delay.assert_called_once_with(self.user.id, token.token)

    def test_verify_email_missing_or_invalid_token(self):
        # Missing token
        response = self.client.get(self.verify_url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("detail", response.json())

        # Invalid token
        response = self.client.get(self.verify_url, {"token": "does-not-exist"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.json()["detail"], "Invalid token.")

    def test_verify_email_expired_or_used(self):
        expired = EmailVerificationToken.objects.create(
            user=self.user,
            token="expired-token",
            expires_at=timezone.now() - timedelta(minutes=1),
        )
        used = EmailVerificationToken.objects.create(
            user=self.user,
            token="used-token",
            expires_at=timezone.now() + timedelta(hours=1),
            used_at=timezone.now(),
        )

        expired_response = self.client.get(self.verify_url, {"token": expired.token})
        self.assertEqual(expired_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(expired_response.json()["detail"], "Token has expired.")

        used_response = self.client.get(self.verify_url, {"token": used.token})
        self.assertEqual(used_response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(used_response.json()["detail"], "Token has already been used.")

    def test_verify_email_success_marks_token_and_profile(self):
        active = EmailVerificationToken.objects.create(
            user=self.user,
            token="active-token",
            expires_at=timezone.now() + timedelta(hours=1),
        )
        other_active = EmailVerificationToken.objects.create(
            user=self.user,
            token="other-active-token",
            expires_at=timezone.now() + timedelta(hours=1),
        )

        response = self.client.get(self.verify_url, {"token": active.token})

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.json(), {"detail": "Email verified successfully."})

        active.refresh_from_db()
        self.assertTrue(active.is_used())

        self.profile.refresh_from_db()
        self.assertIsNotNone(self.profile.email_verified_at)

        other_active.refresh_from_db()
        self.assertTrue(other_active.is_used())
