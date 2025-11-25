from .base import *  # noqa

import os
import urllib.parse

# Make sure we're in non-debug mode in prod (optional, but recommended)
DEBUG = os.environ.get("DJANGO_DEBUG", "False") == "True"

# Force DATABASES from DATABASE_URL, ignoring whatever base.py did
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL is required in production")

parsed = urllib.parse.urlparse(DATABASE_URL)
if parsed.scheme not in ("postgres", "postgresql"):
    raise ValueError(f"Unsupported DATABASE_URL scheme: {parsed.scheme}")

DATABASES = {
    "default": {
        "ENGINE": "django.db.backends.postgresql",
        "NAME": parsed.path.lstrip("/"),
        "USER": parsed.username,
        "PASSWORD": parsed.password,
        "HOST": parsed.hostname,
        "PORT": parsed.port or 5432,
    }
}