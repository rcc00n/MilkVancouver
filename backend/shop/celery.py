import os

from celery import Celery


default_settings = os.environ.get("DJANGO_SETTINGS_MODULE", "shop.settings.local")
os.environ.setdefault("DJANGO_SETTINGS_MODULE", default_settings)

app = Celery("shop")

app.config_from_object("django.conf:settings", namespace="CELERY")

app.autodiscover_tasks()


@app.task(bind=True)
def debug_task(self):
    print(f"Request: {self.request!r}")
