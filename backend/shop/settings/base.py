import os
import urllib.parse
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

# Load environment variables from backend/.env so S3 credentials are present
# regardless of how Django is started (manage.py, gunicorn, or other entrypoints).
load_dotenv(BASE_DIR / ".env")

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "dev-secret-key")
DEBUG = os.environ.get("DJANGO_DEBUG", "True") == "True"

ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",") if os.environ.get("DJANGO_ALLOWED_HOSTS") else []

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
    "products",
    "orders",
    "payments",
    "notifications",
    "contacts",
    "blog",
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
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
    ],
    "DEFAULT_PARSER_CLASSES": [
        "rest_framework.parsers.JSONParser",
    ],
}

EMAIL_BACKEND = os.environ.get("EMAIL_BACKEND", "anymail.backends.sendgrid.EmailBackend")
DEFAULT_FROM_EMAIL = os.environ.get("DEFAULT_FROM_EMAIL", "hello@meatdirect.com")
ANYMAIL = {
    "SENDGRID_API_KEY": os.environ.get("SENDGRID_API_KEY", ""),
}

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
AWS_ACCESS_KEY_ID = os.environ.get("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.environ.get("AWS_SECRET_ACCESS_KEY")
AWS_STORAGE_BUCKET_NAME = os.environ.get("AWS_STORAGE_BUCKET_NAME")
AWS_S3_REGION_NAME = os.environ.get("AWS_S3_REGION_NAME", "ca-central-1")
AWS_MEDIA_LOCATION = os.environ.get("AWS_MEDIA_LOCATION", "media")

if AWS_STORAGE_BUCKET_NAME:
    INSTALLED_APPS.append("storages")
    AWS_S3_CUSTOM_DOMAIN = os.environ.get(
        "AWS_S3_CUSTOM_DOMAIN",
        f"{AWS_STORAGE_BUCKET_NAME}.s3.{AWS_S3_REGION_NAME}.amazonaws.com",
    )
    DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
    STORAGES["default"] = {"BACKEND": DEFAULT_FILE_STORAGE}
    MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/{AWS_MEDIA_LOCATION}/"
else:
    DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"
    STORAGES["default"] = {"BACKEND": DEFAULT_FILE_STORAGE}
    MEDIA_URL = "/media/"
    MEDIA_ROOT = BASE_DIR / "media"

CORS_ALLOWED_ORIGINS = (
    os.environ.get("DJANGO_CORS_ALLOWED_ORIGINS", "").split(",")
    if os.environ.get("DJANGO_CORS_ALLOWED_ORIGINS")
    else []
)
CORS_ALLOW_ALL_ORIGINS = DEBUG

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
