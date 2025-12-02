from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient

from products.models import Product


class ProductAPITests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_lists_only_active_products(self):
        active_one = Product.objects.create(
            name="Active Whole Milk",
            slug="active-whole-milk",
            description="",
            price_cents=500,
            category="dairy",
            is_active=True,
        )
        active_two = Product.objects.create(
            name="Active Skim Milk",
            slug="active-skim-milk",
            description="",
            price_cents=450,
            category="dairy",
            is_active=True,
        )
        Product.objects.create(
            name="Inactive Cheese",
            slug="inactive-cheese",
            description="",
            price_cents=600,
            category="dairy",
            is_active=False,
        )

        response = self.client.get(reverse("product-list"))

        self.assertEqual(response.status_code, 200)
        data = response.json()
        returned_slugs = {item["slug"] for item in data}
        self.assertIn(active_one.slug, returned_slugs)
        self.assertIn(active_two.slug, returned_slugs)
        self.assertNotIn("inactive-cheese", returned_slugs)
        self.assertTrue(all(item["is_active"] for item in data if item["slug"] in {active_one.slug, active_two.slug}))

    def test_search_filters_by_name(self):
        whole_milk = Product.objects.create(
            name="Whole Milk 2L",
            slug="whole-milk-2l",
            description="",
            price_cents=650,
            category="dairy",
            is_active=True,
        )
        skim_milk = Product.objects.create(
            name="Skim Milk 1L",
            slug="skim-milk-1l",
            description="",
            price_cents=550,
            category="dairy",
            is_active=True,
        )
        Product.objects.create(
            name="Orange Juice 1L",
            slug="orange-juice-1l",
            description="",
            price_cents=475,
            category="beverages",
            is_active=True,
        )

        response = self.client.get(reverse("product-list"), {"search": "milk"})

        self.assertEqual(response.status_code, 200)
        data = response.json()
        returned_slugs = {item["slug"] for item in data}
        self.assertIn(whole_milk.slug, returned_slugs)
        self.assertIn(skim_milk.slug, returned_slugs)
        self.assertNotIn("orange-juice-1l", returned_slugs)

    def test_filters_by_category(self):
        dairy_one = Product.objects.create(
            name="Dairy Milk",
            slug="dairy-milk",
            description="",
            price_cents=500,
            category="dairy",
            is_active=True,
        )
        dairy_two = Product.objects.create(
            name="Dairy Cheese",
            slug="dairy-cheese",
            description="",
            price_cents=800,
            category="dairy",
            is_active=True,
        )
        Product.objects.create(
            name="Fresh Apple",
            slug="fresh-apple",
            description="",
            price_cents=250,
            category="produce",
            is_active=True,
        )

        response = self.client.get(reverse("product-list"), {"category": "DAIRY"})

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data), 2)
        returned_names = {item["name"] for item in data}
        self.assertSetEqual(returned_names, {dairy_one.name, dairy_two.name})
