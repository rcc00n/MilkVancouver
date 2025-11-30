from unittest.mock import Mock, patch

from django.test import SimpleTestCase, override_settings

from sms.services import send_sms


class SmsServiceTests(SimpleTestCase):
    @override_settings(TWILIO_FROM_NUMBER="")
    @patch("sms.services._get_twilio_client", return_value=None)
    def test_send_sms_returns_false_when_not_configured(self, mock_get_client):
        result = send_sms("+16045551234", "Hello")

        self.assertFalse(result)
        mock_get_client.assert_called_once()

    def test_send_sms_happy_path_with_fake_client(self):
        class FakeMessages:
            def __init__(self):
                self.calls = []

            def create(self, **kwargs):
                self.calls.append(kwargs)
                return type("Message", (), {"sid": "sid_123"})()

        class FakeClient:
            def __init__(self):
                self.messages = FakeMessages()

        fake_client = FakeClient()

        result = send_sms(
            "+16045551234",
            "Hello",
            from_number="+1234567890",
            client=fake_client,
        )

        self.assertTrue(result)
        self.assertEqual(
            fake_client.messages.calls,
            [
                {"to": "+16045551234", "from_": "+1234567890", "body": "Hello"},
            ],
        )

    def test_send_sms_handles_exception_from_client(self):
        failing_client = Mock()
        failing_client.messages.create.side_effect = Exception("boom")

        result = send_sms(
            "+16045551234",
            "Hello",
            from_number="+1234567890",
            client=failing_client,
        )

        self.assertFalse(result)
