from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from accounts.models import CustomerProfile
from orders.models import Region


User = get_user_model()


class Command(BaseCommand):
    help = "Create or update 10 users with complete customer profiles."

    USER_FIXTURES = [
        {
            "email": "amelia.hughes@example.com",
            "first_name": "Amelia",
            "last_name": "Hughes",
            "password": "Customer123!",
            "phone": "+1-604-555-0101",
            "address_line1": "101 Maple Street",
            "address_line2": "Apt 4B",
            "city": "Vancouver",
            "postal_code": "V5K 0A1",
            "region_code": "north",
        },
        {
            "email": "brian.cho@example.com",
            "first_name": "Brian",
            "last_name": "Cho",
            "password": "Customer123!",
            "phone": "+1-604-555-0102",
            "address_line1": "2307 Marine Drive",
            "address_line2": "Suite 210",
            "city": "West Vancouver",
            "postal_code": "V7V 1K1",
            "region_code": "west",
        },
        {
            "email": "carla.ramirez@example.com",
            "first_name": "Carla",
            "last_name": "Ramirez",
            "password": "Customer123!",
            "phone": "+1-604-555-0103",
            "address_line1": "88 Sunrise Avenue",
            "address_line2": "Unit 305",
            "city": "Vancouver",
            "postal_code": "V5M 3P8",
            "region_code": "east",
        },
        {
            "email": "devon.ford@example.com",
            "first_name": "Devon",
            "last_name": "Ford",
            "password": "Customer123!",
            "phone": "+1-604-555-0104",
            "address_line1": "4125 Fraser Street",
            "address_line2": "Floor 2",
            "city": "Vancouver",
            "postal_code": "V5V 4E9",
            "region_code": "south",
        },
        {
            "email": "emma.wong@example.com",
            "first_name": "Emma",
            "last_name": "Wong",
            "password": "Customer123!",
            "phone": "+1-604-555-0105",
            "address_line1": "600 Granville Street",
            "address_line2": "Apt 1902",
            "city": "Vancouver",
            "postal_code": "V6C 3J3",
            "region_code": "center",
        },
        {
            "email": "farah.khan@example.com",
            "first_name": "Farah",
            "last_name": "Khan",
            "password": "Customer123!",
            "phone": "+1-604-555-0106",
            "address_line1": "1570 Lonsdale Avenue",
            "address_line2": "Unit 12",
            "city": "North Vancouver",
            "postal_code": "V7L 2J1",
            "region_code": "north",
        },
        {
            "email": "george.iverson@example.com",
            "first_name": "George",
            "last_name": "Iverson",
            "password": "Customer123!",
            "phone": "+1-604-555-0107",
            "address_line1": "1450 Bellevue Avenue",
            "address_line2": "Suite 504",
            "city": "West Vancouver",
            "postal_code": "V7T 1C8",
            "region_code": "west",
        },
        {
            "email": "hana.okada@example.com",
            "first_name": "Hana",
            "last_name": "Okada",
            "password": "Customer123!",
            "phone": "+1-604-555-0108",
            "address_line1": "2890 Nanaimo Street",
            "address_line2": "Apt 2E",
            "city": "Vancouver",
            "postal_code": "V5N 5E1",
            "region_code": "east",
        },
        {
            "email": "isaac.ortiz@example.com",
            "first_name": "Isaac",
            "last_name": "Ortiz",
            "password": "Customer123!",
            "phone": "+1-604-555-0109",
            "address_line1": "7500 Oak Street",
            "address_line2": "Townhouse 7",
            "city": "Vancouver",
            "postal_code": "V6P 4A2",
            "region_code": "south",
        },
        {
            "email": "jada.singh@example.com",
            "first_name": "Jada",
            "last_name": "Singh",
            "password": "Customer123!",
            "phone": "+1-604-555-0110",
            "address_line1": "999 Robson Street",
            "address_line2": "Unit 1501",
            "city": "Vancouver",
            "postal_code": "V6Z 3B1",
            "region_code": "center",
        },
    ]

    def handle(self, *args, **options):
        now = timezone.now()
        created_users = 0
        updated_users = 0
        created_profiles = 0
        updated_profiles = 0

        for entry in self.USER_FIXTURES:
            email = entry["email"].lower()
            user, created = User.objects.get_or_create(
                username=email,
                defaults={
                    "email": email,
                    "first_name": entry["first_name"],
                    "last_name": entry["last_name"],
                },
            )

            user_update_fields = []
            if user.username != email:
                user.username = email
                user_update_fields.append("username")
            if user.email != email:
                user.email = email
                user_update_fields.append("email")
            if user.first_name != entry["first_name"]:
                user.first_name = entry["first_name"]
                user_update_fields.append("first_name")
            if user.last_name != entry["last_name"]:
                user.last_name = entry["last_name"]
                user_update_fields.append("last_name")
            if created or not user.has_usable_password():
                user.set_password(entry["password"])
                user_update_fields.append("password")

            if user_update_fields:
                user.save(update_fields=user_update_fields)
                if created:
                    created_users += 1
                else:
                    updated_users += 1
            elif created:
                created_users += 1

            profile, profile_created = CustomerProfile.objects.get_or_create(user=user)
            region = self._resolve_region(entry["region_code"])
            email_verified_at = profile.email_verified_at or entry.get("email_verified_at") or now
            phone_verified_at = profile.phone_verified_at or entry.get("phone_verified_at") or now

            profile_updates = {
                "first_name": entry["first_name"],
                "last_name": entry["last_name"],
                "phone": entry["phone"],
                "address_line1": entry["address_line1"],
                "address_line2": entry["address_line2"],
                "city": entry["city"],
                "postal_code": entry["postal_code"],
                "region_code": entry["region_code"],
                "email_verified_at": email_verified_at,
                "phone_verified_at": phone_verified_at,
            }

            profile_changed = False
            for field, value in profile_updates.items():
                if getattr(profile, field) != value:
                    setattr(profile, field, value)
                    profile_changed = True

            if region and profile.region != region:
                profile.region = region
                profile_changed = True

            if profile_changed:
                profile.save()
                if profile_created:
                    created_profiles += 1
                else:
                    updated_profiles += 1
            elif profile_created:
                created_profiles += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Finished creating customer records. "
                f"Users created: {created_users}, updated: {updated_users}. "
                f"Profiles created: {created_profiles}, updated: {updated_profiles}."
            )
        )

    def _resolve_region(self, region_code):
        if not region_code:
            return None
        region = Region.objects.filter(code__iexact=region_code).first()
        if not region:
            self.stdout.write(
                self.style.WARNING(
                    f"Region with code '{region_code}' not found; leaving region unset."
                )
            )
        return region
