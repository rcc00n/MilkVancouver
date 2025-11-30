from django.conf import settings
from django.test import SimpleTestCase

from shop.celery import app, debug_task


class CeleryConfigTests(SimpleTestCase):
    def test_celery_app_wiring(self):
        self.assertEqual(app.main, "shop")
        self.assertEqual(app.conf.timezone, settings.TIME_ZONE)
        self.assertEqual(app.conf.broker_url, settings.CELERY_BROKER_URL)

    def test_celery_queues_and_beat_defined(self):
        self.assertEqual(settings.CELERY_TASK_DEFAULT_QUEUE, "default")
        queue_names = {queue.name for queue in settings.CELERY_TASK_QUEUES}
        self.assertSetEqual(queue_names, {"default", "emails", "sms", "logistics"})
        self.assertIsInstance(settings.CELERY_BEAT_SCHEDULE, dict)

    def test_debug_task_registered(self):
        self.assertIn(debug_task.name, app.tasks)
