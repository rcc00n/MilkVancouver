import logging

logger = logging.getLogger(__name__)


def send_sms(to: str, text: str) -> None:
    """
    Low-level SMS sender function.
    In production, integrate with real provider (Twilio, etc).
    For now, it can be a stub that logs/prints.
    """
    logger.info("Sending SMS to %s: %s", to, text)
