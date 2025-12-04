import os
import urllib.parse
from pathlib import Path
from celery.schedules import crontab
from dotenv import load_dotenv
from kombu import Queue

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load environment variables from backend/.env so S3 credentials are present
# regardless of how Django is started (manage.py, gunicorn, or other entrypoints).
load_dotenv(BASE_DIR / ".env")


def env_list(var_name: str, fallback=None):
    raw_value = os.environ.get(var_name)
    if raw_value:
        return [item.strip().rstrip("/") for item in raw_value.split(",") if item.strip()]
    return fallback or []


def env_bool(var_name: str, default=False) -> bool:
    raw_value = os.environ.get(var_name)
    if raw_value is None:
        return default
    return raw_value.strip().lower() in ("1", "true", "yes", "on")

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-secret-key")
DEBUG = os.environ.get("DJANGO_DEBUG", "True") == "True"

BACKEND_HOST = os.environ.get("DJANGO_BACKEND_HOST", "api.milkvanq.duckdns.org")
DEFAULT_ALLOWED_HOSTS = [BACKEND_HOST, "localhost", "127.0.0.1"]
ALLOWED_HOSTS = env_list("DJANGO_ALLOWED_HOSTS", DEFAULT_ALLOWED_HOSTS)

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "anymail",
    "corsheaders",
    "rest_framework",
    "drf_spectacular",
    "accounts",
    "products",
    "orders",
    "delivery",
    "payments",
    "notifications",
    "contacts",
    "blog",
    "admin_api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "shop.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "shop.wsgi.application"

# Prefer DATABASE_URL (Postgres on Dokku) and fall back to sqlite for local dev.
DATABASE_URL = os.environ.get("DATABASE_URL")
if DATABASE_URL:
    parsed = urllib.parse.urlparse(DATABASE_URL)
    if parsed.scheme not in ("postgres", "postgresql"):
        raise ValueError("Unsupported database scheme in DATABASE_URL")

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
else:
    db_path = os.environ.get("DJANGO_DB_PATH")
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": db_path if db_path else BASE_DIR / "db.sqlite3",
        }
    }

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": [
        "rest_framework.authentication.SessionAuthentication",
    ],
    "DEFAULT_PERMISSION_CLASSES": [
        "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    ],
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
    ],
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "MilkVanq API",
    "DESCRIPTION": "API documentation for the MilkVanq grocery delivery platform.",
    "VERSION": "1.0.0",
}

EMAIL_BACKEND = os.environ.get("EMAIL_BACKEND", "anymail.backends.sendgrid.EmailBackend")
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "hello@meatdirect.com")
ANYMAIL = {
    "SENDGRID_API_KEY": os.environ.get("SENDGRID_API_KEY", ""),
}

STRIPE_SECRET_KEY = os.environ.get("STRIPE_SECRET_KEY", "")
GOOGLE_MAPS_API_KEY = os.environ.get("GOOGLE_MAPS_API_KEY", "")
DELIVERY_DEPOT_LAT = os.environ.get("DELIVERY_DEPOT_LAT")
DELIVERY_DEPOT_LNG = os.environ.get("DELIVERY_DEPOT_LNG")

AUTH_PASSWORD_VALIDATORS = [
    {
        "NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.CommonPasswordValidator",
    },
    {
        "NAME": "django.contrib.auth.password_validation.NumericPasswordValidator",
    },
]

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "static"
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# Django 4.2+/5.0 uses STORAGES; set both STORAGES and DEFAULT_FILE_STORAGE for compatibility.
STORAGES = {
    "staticfiles": {
        "BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage",
    }
}

# AWS / media storage
USE_S3 = env_bool("USE_S3", True)
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = os.environ.get("AWS_STORAGE_BUCKET_NAME")
AWS_S3_REGION_NAME = os.environ.get("AWS_S3_REGION_NAME", "ca-central-1")
AWS_MEDIA_LOCATION = os.environ.get("AWS_MEDIA_LOCATION", "media")
AWS_S3_ENDPOINT_URL = os.environ.get("AWS_S3_ENDPOINT_URL")
AWS_S3_CONNECT_TIMEOUT = int(os.environ.get("AWS_S3_CONNECT_TIMEOUT", 5))
AWS_S3_READ_TIMEOUT = int(os.environ.get("AWS_S3_READ_TIMEOUT", 10))

if USE_S3 and AWS_STORAGE_BUCKET_NAME:
    INSTALLED_APPS.append("storages")
    AWS_S3_CUSTOM_DOMAIN = os.environ.get(
        "AWS_S3_CUSTOM_DOMAIN",
        f"{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com",
    )
    DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
    STORAGES["default"] = {"BACKEND": DEFAULT_FILE_STORAGE}
    MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/{AWS_MEDIA_LOCATION}/"
    AWS_S3_CONFIG = {
        "connect_timeout": AWS_S3_CONNECT_TIMEOUT,
        "read_timeout": AWS_S3_READ_TIMEOUT,
        "retries": {"max_attempts": 2},
    }
else:
    DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
    STORAGES["default"] = {"BACKEND": DEFAULT_FILE_STORAGE}
    MEDIA_URL = "/media/"
    MEDIA_ROOT = BASE_DIR / "media"

# Default origins for the Dokku deployment; override via env vars if needed.
FRONTEND_ORIGINS = env_list(
    "DJANGO_FRONTEND_ORIGINS",
    ["http://milkvanq.duckdns.org", "https://milkvanq.duckdns.org"],
)
PASSWORD_RESET_BASE_URL = os.environ.get("PASSWORD_RESET_BASE_URL")
CORS_ALLOWED_ORIGINS = env_list("DJANGO_CORS_ALLOWED_ORIGINS", FRONTEND_ORIGINS)
CORS_ALLOW_ALL_ORIGINS = DEBUG
CORS_ALLOW_CREDENTIALS = True
CSRF_TRUSTED_ORIGINS = env_list(
    "DJANGO_CSRF_TRUSTED_ORIGINS",
    FRONTEND_ORIGINS + [f"http://{BACKEND_HOST}", f"https://{BACKEND_HOST}"],
)

# Allow overriding cookie settings for cross-site frontend/backend setups.
COOKIE_DOMAIN = os.environ.get("DJANGO_COOKIE_DOMAIN")
# Fall back to the Dokku domain in production so cookies work across subdomains.
if not COOKIE_DOMAIN and not DEBUG and BACKEND_HOST.endswith("milkvanq.duckdns.org"):
    COOKIE_DOMAIN = ".milkvanq.duckdns.org"
CSRF_COOKIE_DOMAIN = COOKIE_DOMAIN or None
SESSION_COOKIE_DOMAIN = COOKIE_DOMAIN or None
CSRF_COOKIE_SAMESITE = os.environ.get("DJANGO_CSRF_COOKIE_SAMESITE", "Lax")
CSRF_COOKIE_SECURE = os.environ.get("DJANGO_CSRF_COOKIE_SECURE", "False") == "True"
SESSION_COOKIE_SAMESITE = os.environ.get("DJANGO_SESSION_COOKIE_SAMESITE", "Lax")
SESSION_COOKIE_SECURE = os.environ.get("DJANGO_SESSION_COOKIE_SECURE", "False") == "True"

# For local development we prefer host-only, non-secure cookies so sessions work on
# http://localhost and 127.0.0.1 without needing HTTPS or a custom domain.
if DEBUG:
    COOKIE_DOMAIN = None
    CSRF_COOKIE_DOMAIN = None
    SESSION_COOKIE_DOMAIN = None
    CSRF_COOKIE_SECURE = False
    SESSION_COOKIE_SECURE = False

CELERY_BROKER_URL = os.environ.get("CELERY_BROKER_URL", "redis://localhost:6379/0")
CELERY_RESULT_BACKEND = os.environ.get("CELERY_RESULT_BACKEND", CELERY_BROKER_URL)
CELERY_TIMEZONE = TIME_ZONE
CELERY_ENABLE_UTC = True
CELERY_TASK_DEFAULT_QUEUE = "default"
CELERY_TASK_QUEUES = (
    Queue("default"),
    Queue("emails"),
    Queue("sms"),
    Queue("logistics"),
)
CELERY_BEAT_SCHEDULE = {
    "cleanup_phone_verifications_daily": {
        "task": "accounts.tasks.cleanup_expired_phone_verifications",
        "schedule": crontab(hour=3, minute=0),
    },
    "cleanup_email_verification_tokens_daily": {
        "task": "accounts.tasks.cleanup_email_verification_tokens",
        "schedule": crontab(hour=3, minute=5),
    },
    "cleanup_password_reset_tokens_daily": {
        "task": "accounts.tasks.cleanup_password_reset_tokens",
        "schedule": crontab(hour=3, minute=10),
    },
    "expire_stale_pending_orders_hourly": {
        "task": "orders.tasks.expire_stale_pending_orders",
        "schedule": crontab(minute=0),
    },
    "generate_delivery_routes_weekly": {
        "task": "delivery.tasks.generate_delivery_routes",
        "schedule": crontab(hour=2, minute=0, day_of_week="sun"),  # Sunday night
        "options": {"queue": "logistics"},
    },
    "optimize_delivery_routes_weekly": {
        "task": "delivery.tasks.optimize_future_routes",
        "schedule": crontab(hour=3, minute=0, day_of_week="sun"),
        "options": {"queue": "logistics"},
    },
    "generate_delivery_routes_nightly": {
        "task": "delivery.tasks.generate_delivery_routes",
        "schedule": crontab(hour=2, minute=0),  # every night at 02:00
        "options": {"queue": "logistics"},
    },
}

TWILIO_ACCOUNT_SID = os.environ.get("TWILIO_ACCOUNT_SID", "")
TWILIO_AUTH_TOKEN = os.environ.get("TWILIO_AUTH_TOKEN", "")
TWILIO_FROM_NUMBER = os.environ.get("TWILIO_FROM_NUMBER", "")

PHONE_VERIFICATION_MAX_ATTEMPTS = int(os.environ.get("PHONE_VERIFICATION_MAX_ATTEMPTS", 5))
PHONE_VERIFICATION_MAX_PER_DAY = int(os.environ.get("PHONE_VERIFICATION_MAX_PER_DAY", 3))
PHONE_VERIFICATION_TTL_MINUTES = int(os.environ.get("PHONE_VERIFICATION_TTL_MINUTES", 10))
PASSWORD_RESET_TOKEN_TTL_MINUTES = int(os.environ.get("PASSWORD_RESET_TOKEN_TTL_MINUTES", 60))

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "structured": {
            "format": 'level=%(levelname)s logger=%(name)s time="%(asctime)s" message="%(message)s" module=%(module)s func=%(funcName)s lineno=%(lineno)d',
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "structured",
        }
    },
    "loggers": {
        "accounts": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "payments": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "delivery": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "notifications": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "stripe": {"handlers": ["console"], "level": "WARNING", "propagate": False},
        "celery": {"handlers": ["console"], "level": "INFO", "propagate": False},
        "django.request": {"handlers": ["console"], "level": "ERROR", "propagate": False},
    },
}

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
