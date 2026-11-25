"""Run existing focused regressions without external services or private data."""
from pathlib import Path
import compileall
import os
import socket
import sys
import tempfile

ROOT = Path(__file__).resolve().parents[1]
os.chdir(ROOT)
sys.path.insert(0, str(ROOT))
sys.path.insert(0, str(ROOT / 'backend'))
os.environ["DJANGO_SETTINGS_MODULE"] = "ci.settings"
os.environ["PYTHONDONTWRITEBYTECODE"] = "1"

def block_network(*args, **kwargs):
    raise RuntimeError("Network access is disabled in focused CI checks")

socket.create_connection = block_network
socket.socket.connect = block_network
socket.socket.connect_ex = block_network

import django  # noqa: E402
from django.core.management import call_command  # noqa: E402

django.setup()
with tempfile.TemporaryDirectory(prefix="synthetic-ci-") as scratch:
    from django.test import override_settings
    with override_settings(MEDIA_ROOT=scratch):
        call_command("check")
        call_command("test", *['shop.tests.test_celery_config', 'shop.tests.test_settings_and_email', 'payments.tests.test_payment_service'], verbosity=2, interactive=False)
