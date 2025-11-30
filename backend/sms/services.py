import logging
from typing import Optional, TYPE_CHECKING

from django.conf import settings

try:
    from twilio.rest import Client
except ImportError:
    Client = None  # type: ignore

if TYPE_CHECKING:
    from twilio.rest import Client as TwilioClient


logger = logging.getLogger(__name__)


def _get_twilio_client() -> Optional["Client"]:
    account_sid = getattr(settings, "TWILIO_ACCOUNT_SID", "")
    auth_token = getattr(settings, "TWILIO_AUTH_TOKEN", "")

    if not Client or not account_sid or not auth_token:
        return None

    return Client(account_sid, auth_token)


def send_sms(
    to: str,
    body: str,
    *,
    from_number: Optional[str] = None,
    client: Optional["Client"] = None,
) -> bool:
    twilio_client = client or _get_twilio_client()
    from_phone = from_number or getattr(settings, "TWILIO_FROM_NUMBER", "")

    if not twilio_client or not from_phone:
        logger.warning("Twilio SMS not sent: missing client or from number")
        return False

    try:
        message = twilio_client.messages.create(to=to, from_=from_phone, body=body)
    except Exception:
        logger.exception("Failed to send SMS via Twilio to %s", to)
        return False

    sid = getattr(message, "sid", None)
    if sid:
        logger.info("Sent SMS via Twilio to %s (sid=%s)", to, sid)
    else:
        logger.info("Sent SMS via Twilio to %s", to)

    return True
