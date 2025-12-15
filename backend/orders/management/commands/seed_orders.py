import random
from typing import List

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from orders.models import Order, OrderItem, Region
from products.models import Product


User = get_user_model()


class Command(BaseCommand):
    help = "Create sample paid orders for existing users and regions."

    def add_arguments(self, parser):
        parser.add_argument(
            "--count",
            type=int,
            default=30,
            help="Number of orders to create (default: 30).",
        )

    def handle(self, *args, **options):
        order_count = options.get("count") or 30

        users: List[User] = list(User.objects.select_related("customer_profile").all())
        products: List[Product] = list(Product.objects.filter(is_active=True))
        regions: List[Region] = list(Region.objects.all())

        if not users:
            raise CommandError("No users found; create users first.")
        if not products:
            raise CommandError("No products found; seed or create products first.")
        if not regions:
            raise CommandError("No regions found; seed or create regions first.")

        created = 0
        for _ in range(order_count):
            with transaction.atomic():
                user = random.choice(users)
                region = random.choice(regions)
                profile = getattr(user, "customer_profile", None)

                full_name = self._full_name(user, profile)
                email = getattr(user, "email", "") or getattr(user, "username", "")
                phone = self._phone(profile)
                address_line1, address_line2, city, postal_code = self._address(profile, region)

                order = Order.objects.create(
                    user=user,
                    region=region,
                    full_name=full_name,
                    email=email,
                    phone=phone,
                    address_line1=address_line1,
                    address_line2=address_line2,
                    city=city,
                    postal_code=postal_code,
                    order_type=Order.OrderType.DELIVERY,
                    status=Order.Status.PAID,
                )

                subtotal_cents = 0
                for _ in range(random.randint(1, 3)):
                    product = random.choice(products)
                    quantity = random.randint(1, 3)
                    line_total = product.price_cents * quantity
                    subtotal_cents += line_total
                    OrderItem.objects.create(
                        order=order,
                        product=product,
                        product_name=product.name,
                        quantity=quantity,
                        unit_price_cents=product.price_cents,
                        total_cents=line_total,
                    )

                tax_cents = int(round(subtotal_cents * 0.05))
                order.subtotal_cents = subtotal_cents
                order.tax_cents = tax_cents
                order.total_cents = subtotal_cents + tax_cents
                order.save(update_fields=["subtotal_cents", "tax_cents", "total_cents"])

                created += 1

        self.stdout.write(self.style.SUCCESS(f"Created {created} paid orders."))

    def _full_name(self, user, profile):
        first = getattr(user, "first_name", "") or getattr(profile, "first_name", "") or "Customer"
        last = getattr(user, "last_name", "") or getattr(profile, "last_name", "") or "User"
        return f"{first} {last}".strip()

    def _phone(self, profile):
        if profile and profile.phone:
            return profile.phone
        # Basic fallback phone number.
        return f"+1-604-555-{random.randint(1000, 9999)}"

    def _address(self, profile, region):
        if profile:
            line1 = profile.address_line1 or "123 Sample Street"
            line2 = profile.address_line2 or ""
            city = profile.city or region.name
            postal = profile.postal_code or "V5K 0A1"
            return line1, line2, city, postal
        return (
            f"{random.randint(100, 999)} {region.name} Road",
            "",
            region.name,
            "V5K 0A1",
        )
