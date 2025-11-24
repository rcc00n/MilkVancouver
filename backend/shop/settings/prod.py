from .base import *  # noqa

DEBUG = False
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY")
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",") if os.environ.get("DJANGO_ALLOWED_HOSTS") else []
CORS_ALLOWED_ORIGINS = os.environ.get("DJANGO_CORS_ALLOWED_ORIGINS", "").split(",") if os.environ.get("DJANGO_CORS_ALLOWED_ORIGINS") else []

if not SECRET_KEY:
    raise ValueError("DJANGO_SECRET_KEY is required in production")
