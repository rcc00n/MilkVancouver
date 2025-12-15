from typing import Dict, List

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from accounts.models import CustomerProfile
from delivery.models import Driver
from orders.models import Region

User = get_user_model()


class Command(BaseCommand):
    help = "Create 7 drivers, one per weekday, aligned to regions by delivery_weekday."

    DRIVERS: List[Dict] = [
        {"weekday": 0, "email": "driver.mon@example.com", "first_name": "Morgan", "last_name": "Day"},
        {"weekday": 1, "email": "driver.tue@example.com", "first_name": "Taylor", "last_name": "Lane"},
        {"weekday": 2, "email": "driver.wed@example.com", "first_name": "Riley", "last_name": "Park"},
        {"weekday": 3, "email": "driver.thu@example.com", "first_name": "Jordan", "last_name": "Brook"},
        {"weekday": 4, "email": "driver.fri@example.com", "first_name": "Casey", "last_name": "Vale"},
        {"weekday": 5, "email": "driver.sat@example.com", "first_name": "Alex", "last_name": "Stone"},
        {"weekday": 6, "email": "driver.sun@example.com", "first_name": "Jamie", "last_name": "Shore"},
    ]
    DEFAULT_PASSWORD = "Driver123!"
    DEFAULT_PHONE = "+1-604-555-0{weekday:02d}"

    def handle(self, *args, **options):
        regions_by_weekday = {
            region.delivery_weekday: region for region in Region.objects.all()
        }
        if len(regions_by_weekday) < 7:
            missing = sorted(set(range(7)) - set(regions_by_weekday.keys()))
            for day in missing:
                self.stdout.write(self.style.WARNING(f"No region configured for weekday {day}; driver will still be created but preferred_region will be empty."))

        created_drivers = 0
        updated_drivers = 0

        for entry in self.DRIVERS:
            weekday = entry["weekday"]
            email = entry["email"].lower()
            first_name = entry["first_name"]
            last_name = entry["last_name"]
            phone = self.DEFAULT_PHONE.format(weekday=weekday)

            user, user_created = User.objects.get_or_create(
                username=email,
                defaults={
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                },
            )
            user_update_fields = []
            if user.email != email:
                user.email = email
                user_update_fields.append("email")
            if user.username != email:
                user.username = email
                user_update_fields.append("username")
            if user.first_name != first_name:
                user.first_name = first_name
                user_update_fields.append("first_name")
            if user.last_name != last_name:
                user.last_name = last_name
                user_update_fields.append("last_name")
            if user_created or not user.has_usable_password():
                user.set_password(self.DEFAULT_PASSWORD)
                user_update_fields.append("password")
            if user_update_fields:
                user.save(update_fields=user_update_fields)

            profile, _ = CustomerProfile.objects.get_or_create(user=user)
            if not profile.phone:
                profile.phone = phone
                profile.save(update_fields=["phone", "updated_at"])

            preferred_region = regions_by_weekday.get(weekday)
            defaults = {
                "phone": profile.phone or phone,
                "notes": f"Primary day: {self._weekday_label(weekday)}",
                "operating_weekdays": [weekday],
                "preferred_region": preferred_region,
                "min_stops_for_dedicated_route": 5,
            }
            driver, created = Driver.objects.update_or_create(
                user=user,
                defaults=defaults,
            )
            if created:
                created_drivers += 1
            else:
                updated_drivers += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Drivers created: {created_drivers}, updated: {updated_drivers}."
            )
        )

    @staticmethod
    def _weekday_label(value: int) -> str:
        labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        if 0 <= value < len(labels):
            return labels[value]
        return str(value)
