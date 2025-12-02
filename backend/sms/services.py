import logging
from typing import Any, Dict, Optional

from django.conf import settings

logger = logging.getLogger(__name__)


def _create_twilio_client():
    from twilio.rest import Client

    return Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)


def send_sms(
    to: str,
    message: str,
    *,
    metadata: Optional[Dict[str, Any]] = None,
    max_retries: int = 3,
) -> None:
    """
    Send an SMS using the configured provider (Twilio) with retry logic and structured logging.
    """
    metadata = metadata or {}
    from_number = settings.TWILIO_FROM_NUMBER

    for attempt in range(1, max_retries + 1):
        try:
            client = _create_twilio_client()
            response = client.messages.create(body=message, from_=from_number, to=to)
            logger.info(
                "sms_sent",
                extra={
                    "to": to,
                    "from": from_number,
                    "sid": getattr(response, "sid", None),
                    "attempt": attempt,
                    "metadata": metadata,
                },
            )
            return
        except Exception:
            logger.error(
                "sms_send_failed",
                extra={
                    "to": to,
                    "from": from_number,
                    "attempt": attempt,
                    "max_retries": max_retries,
                    "metadata": metadata,
                },
                exc_info=True,
            )
            if attempt >= max_retries:
                raise
