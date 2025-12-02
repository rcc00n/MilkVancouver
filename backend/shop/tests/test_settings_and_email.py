from django.conf import settings
from django.test import SimpleTestCase
from shop.settings import base as base_settings


class SettingsAndEmailTests(SimpleTestCase):
    def test_database_settings_present(self):
        default_db = settings.DATABASES.get("default")
        self.assertIsInstance(default_db, dict)
        self.assertIn("ENGINE", default_db)
        self.assertIn("NAME", default_db)

    def test_sendgrid_email_backend_defaults(self):
        expected_backend = "anymail.backends.sendgrid.EmailBackend"
        self.assertEqual(base_settings.EMAIL_BACKEND, expected_backend)
        self.assertIn(
            settings.EMAIL_BACKEND,
            [expected_backend, "django.core.mail.backends.locmem.EmailBackend"],
        )
        self.assertTrue(isinstance(settings.DEFAULT_FROM_EMAIL, str))
        self.assertTrue(settings.DEFAULT_FROM_EMAIL)
        self.assertTrue(hasattr(settings, "ANYMAIL"))
        self.assertIn("SENDGRID_API_KEY", settings.ANYMAIL)

    def test_twilio_settings_present(self):
        for attr in ("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_FROM_NUMBER"):
            self.assertTrue(hasattr(settings, attr))
