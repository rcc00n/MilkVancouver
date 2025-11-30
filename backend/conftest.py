import os

import django
import pytest
from django.conf import settings
from django.test.runner import DiscoverRunner

# Ensure Django settings are configured before importing app modules in tests.
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "shop.settings.local")
# Force SQLite for tests even if DATABASE_URL is set in the environment.
os.environ["DATABASE_URL"] = ""
# Disable Stripe webhook signature enforcement for tests.
os.environ["STRIPE_WEBHOOK_SECRET"] = ""


def pytest_configure():
    if not settings.configured:
        django.setup()
    else:
        try:
            django.setup()
        except RuntimeError:
            # Django may already be set up; ignore repeated setup attempts.
            pass


@pytest.fixture(scope="session", autouse=True)
def django_db_setup_and_teardown():
    """
    Create and tear down the Django test databases for pytest runs without pytest-django.
    """
    test_runner = DiscoverRunner()
    old_config = test_runner.setup_databases()
    try:
        yield
    finally:
        test_runner.teardown_databases(old_config)
