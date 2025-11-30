from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from accounts.models import CustomerProfile


User = get_user_model()


class AuthProfileAPITests(APITestCase):
    def setUp(self):
        self.register_url = reverse("auth-register")
        self.login_url = reverse("auth-login")
        self.me_url = reverse("auth-me")
        self.profile_url = reverse("customer-profile")

    def test_registration_creates_user_and_profile_and_logs_in(self):
        payload = {
            "email": "newuser@example.com",
            "password": "strongpassword",
            "first_name": "New",
            "last_name": "User",
            "phone": "1234567890",
            "address_line1": "123 Main St",
            "address_line2": "Unit 5",
            "city": "Metropolis",
            "postal_code": "12345",
            "region_code": "North",
        }

        response = self.client.post(self.register_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("user", response.data)
        self.assertIn("profile", response.data)

        user = User.objects.get(email=payload["email"])
        self.assertEqual(user.username, payload["email"])
        self.assertEqual(user.email, payload["email"])

        profile = CustomerProfile.objects.get(user=user)
        self.assertEqual(profile.first_name, payload["first_name"])
        self.assertEqual(profile.last_name, payload["last_name"])
        self.assertEqual(profile.phone, payload["phone"])
        self.assertEqual(profile.address_line1, payload["address_line1"])
        self.assertEqual(profile.address_line2, payload["address_line2"])
        self.assertEqual(profile.city, payload["city"])
        self.assertEqual(profile.postal_code, payload["postal_code"])
        self.assertEqual(profile.region_code, payload["region_code"])

        # Session should be established; calling /auth/me/ should succeed.
        me_response = self.client.get(self.me_url)
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data["user"]["email"], payload["email"])
        self.assertEqual(me_response.data["profile"]["phone"], payload["phone"])

    def test_registration_rejects_duplicate_email(self):
        email = "dupe@example.com"
        User.objects.create_user(username=email, email=email, password="password123")

        payload = {"email": email, "password": "anotherpassword"}
        response = self.client.post(self.register_url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_login_returns_user_and_profile_and_sets_session(self):
        email = "login@example.com"
        password = "securepass"
        user = User.objects.create_user(username=email, email=email, password=password)
        CustomerProfile.objects.get_or_create(user=user)

        response = self.client.post(
            self.login_url, {"email": email, "password": password}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("user", response.data)
        self.assertIn("profile", response.data)
        self.assertEqual(response.data["user"]["email"], email)

        me_response = self.client.get(self.me_url)
        self.assertEqual(me_response.status_code, status.HTTP_200_OK)
        self.assertEqual(me_response.data["user"]["email"], email)

    def test_login_with_wrong_password_fails(self):
        email = "wrongpass@example.com"
        password = "correctpass"
        User.objects.create_user(username=email, email=email, password=password)

        response = self.client.post(
            self.login_url, {"email": email, "password": "incorrect"}, format="json"
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data.get("detail"), "Invalid email or password.")

    def test_me_requires_authentication(self):
        response = self.client.get(self.me_url)
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

        email = "me@example.com"
        password = "password123"
        user = User.objects.create_user(username=email, email=email, password=password)
        CustomerProfile.objects.get_or_create(user=user)
        self.client.login(username=email, password=password)

        authed_response = self.client.get(self.me_url)
        self.assertEqual(authed_response.status_code, status.HTTP_200_OK)
        self.assertEqual(authed_response.data["user"]["id"], user.id)
        self.assertEqual(authed_response.data["user"]["email"], email)

    def test_profile_endpoint_requires_authentication(self):
        response = self.client.get(self.profile_url)
        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

    def test_profile_get_and_patch_updates_profile_and_user_names(self):
        email = "profile@example.com"
        password = "password123"
        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name="Old",
            last_name="Name",
        )
        profile = CustomerProfile.objects.get(user=user)
        profile.first_name = "Old"
        profile.last_name = "Name"
        profile.save()

        self.client.login(username=email, password=password)

        get_response = self.client.get(self.profile_url)
        self.assertEqual(get_response.status_code, status.HTTP_200_OK)
        self.assertEqual(get_response.data["first_name"], "Old")
        self.assertEqual(get_response.data["last_name"], "Name")

        update_payload = {
            "first_name": "NewFirst",
            "last_name": "NewLast",
            "phone": "555-1234",
            "address_line1": "456 Other St",
            "address_line2": "Suite 2",
            "city": "Gotham",
            "postal_code": "67890",
            "region_code": "South",
        }

        patch_response = self.client.patch(self.profile_url, update_payload, format="json")
        self.assertEqual(patch_response.status_code, status.HTTP_200_OK)
        self.assertEqual(patch_response.data["first_name"], update_payload["first_name"])
        self.assertEqual(patch_response.data["last_name"], update_payload["last_name"])
        self.assertEqual(patch_response.data["phone"], update_payload["phone"])
        self.assertEqual(patch_response.data["address_line1"], update_payload["address_line1"])
        self.assertEqual(patch_response.data["address_line2"], update_payload["address_line2"])
        self.assertEqual(patch_response.data["city"], update_payload["city"])
        self.assertEqual(patch_response.data["postal_code"], update_payload["postal_code"])
        self.assertEqual(patch_response.data["region_code"], update_payload["region_code"])

        profile.refresh_from_db()
        self.assertEqual(profile.first_name, update_payload["first_name"])
        self.assertEqual(profile.last_name, update_payload["last_name"])
        self.assertEqual(profile.phone, update_payload["phone"])
        self.assertEqual(profile.address_line1, update_payload["address_line1"])
        self.assertEqual(profile.address_line2, update_payload["address_line2"])
        self.assertEqual(profile.city, update_payload["city"])
        self.assertEqual(profile.postal_code, update_payload["postal_code"])
        self.assertEqual(profile.region_code, update_payload["region_code"])

        user.refresh_from_db()
        self.assertEqual(user.first_name, update_payload["first_name"])
        self.assertEqual(user.last_name, update_payload["last_name"])

    def test_signal_creates_profile_on_user_creation(self):
        email = "signal@example.com"
        user = User.objects.create_user(username=email, email=email, password="password123", first_name="Sig", last_name="Nal")

        profile = CustomerProfile.objects.get(user=user)
        self.assertEqual(profile.first_name, "Sig")
        self.assertEqual(profile.last_name, "Nal")
