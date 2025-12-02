from unittest.mock import Mock, patch

from django.test import SimpleTestCase, override_settings

from sms.services import send_sms


class SmsServiceTests(SimpleTestCase):
    @override_settings(TWILIO_FROM_NUMBER="+15551112222")
    @patch("sms.services._create_twilio_client")
    def test_send_sms_logs_success(self, mock_client_factory):
        client = Mock()
        client.messages.create.return_value = Mock(sid="SM123")
        mock_client_factory.return_value = client

        with self.assertLogs("sms.services", level="INFO") as logs:
            send_sms("+16045551234", "Hello", metadata={"kind": "test"})

        client.messages.create.assert_called_once_with(
            body="Hello",
            from_="+15551112222",
            to="+16045551234",
        )
        self.assertTrue(any("sms_sent" in msg for msg in logs.output))

    @override_settings(TWILIO_FROM_NUMBER="+15554445555")
    @patch("sms.services._create_twilio_client")
    def test_send_sms_retries_on_failure_then_succeeds(self, mock_client_factory):
        client = Mock()
        client.messages.create.side_effect = [Exception("boom"), Mock(sid="SM999")]
        mock_client_factory.return_value = client

        with self.assertLogs("sms.services", level="INFO") as logs:
            send_sms("+16045550000", "Hi", max_retries=2)

        self.assertEqual(client.messages.create.call_count, 2)
        self.assertTrue(any("sms_send_failed" in msg for msg in logs.output))
        self.assertTrue(any("sms_sent" in msg for msg in logs.output))

    @override_settings(TWILIO_FROM_NUMBER="+15550000000")
    @patch("sms.services._create_twilio_client")
    def test_send_sms_raises_after_exhausting_retries(self, mock_client_factory):
        client = Mock()
        client.messages.create.side_effect = Exception("fail")
        mock_client_factory.return_value = client

        with self.assertLogs("sms.services", level="ERROR"):
            with self.assertRaises(Exception):
                send_sms("+16045553333", "Hi", max_retries=2)

        self.assertEqual(client.messages.create.call_count, 2)
