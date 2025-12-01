from django.test import SimpleTestCase

from sms.services import send_sms


class SmsServiceTests(SimpleTestCase):
    def test_send_sms_logs_message(self):
        with self.assertLogs("sms.services", level="INFO") as logs:
            send_sms("+16045551234", "Hello")

        self.assertTrue(any("Sending SMS to +16045551234: Hello" in msg for msg in logs.output))
