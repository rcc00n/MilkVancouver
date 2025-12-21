from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from accounts.models import CustomerProfile
from delivery.models import Driver
from orders.models import Region
from products.models import Category, Product


class Command(BaseCommand):
    help = "Seed demo data including regions, products, and a driver user."

    def handle(self, *args, **options):
        self._seed_regions()
        self._seed_products()
        self._seed_driver()
        self.stdout.write(self.style.SUCCESS("Demo data seeded successfully."))

    def _seed_regions(self):
        regions = [
            ("north", "North Vancouver", 0, 5),
            ("west", "West Vancouver", 1, 5),
            ("east", "East Vancouver", 2, 5),
            ("south", "South Vancouver", 3, 5),
            ("center", "Vancouver Center", 4, 5),
        ]
        for code, name, weekday, min_orders in regions:
            Region.objects.update_or_create(
                code=code,
                defaults={
                    "name": name,
                    "delivery_weekday": weekday,
                    "min_orders": min_orders,
                },
            )

    def _seed_products(self):
        products = [
            ("Whole Milk 2L", "whole-milk-2l", 799, "dairy"),
            ("Skim Milk 1L", "skim-milk-1l", 499, "dairy"),
            ("Yogurt 500ml", "yogurt-500ml", 399, "dairy"),
        ]
        for name, slug, price_cents, category_slug in products:
            category, _ = Category.objects.get_or_create(
                slug=category_slug, defaults={"name": category_slug.title()}
            )
            Product.objects.update_or_create(
                slug=slug,
                defaults={
                    "name": name,
                    "description": "",
                    "price_cents": price_cents,
                    "category": category,
                    "is_active": True,
                },
            )

    def _seed_driver(self):
        User = get_user_model()
        driver_email = "driver@milkvanq.local"
        user, created = User.objects.get_or_create(
            username=driver_email,
            defaults={"email": driver_email},
        )
        if created:
            user.set_password("driver1234")
            user.save()

        profile, _ = CustomerProfile.objects.get_or_create(user=user)
        if not profile.phone:
            profile.phone = "+15550000000"
            profile.save(update_fields=["phone", "updated_at"])

        Driver.objects.get_or_create(
            user=user,
            defaults={"phone": profile.phone or "+15550000000"},
        )
