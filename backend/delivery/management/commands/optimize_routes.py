from django.core.management.base import BaseCommand

from delivery.tasks import optimize_future_routes


class Command(BaseCommand):
    help = "Trigger asynchronous optimization of future delivery routes."

    def handle(self, *args, **options):
        optimize_future_routes.delay()
        self.stdout.write(self.style.SUCCESS("Queued optimize_future_routes task"))
