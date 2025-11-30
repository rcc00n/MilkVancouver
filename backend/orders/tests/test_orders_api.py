from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from orders.models import Order
from products.models import Product


class OrderAPITests(APITestCase):
    def setUp(self):
        self.order_list_url = reverse("order-list")

    def test_create_pickup_order_success(self):
        product1 = Product.objects.create(
            name="Milk", slug="milk", price_cents=1000
        )
        product2 = Product.objects.create(
            name="Bread", slug="bread", price_cents=2500
        )

        payload = {
            "full_name": "Ada Lovelace",
            "email": "ada@example.com",
            "phone": "123-456",
            "order_type": "pickup",
            "items": [
                {"product_id": product1.id, "quantity": 2},
                {"product_id": product2.id, "quantity": 1},
            ],
            "notes": "No onions",
            "pickup_location": "Front desk",
            "pickup_instructions": "Ring bell",
        }

        response = self.client.post(
            self.order_list_url, payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.data

        expected_subtotal = product1.price_cents * 2 + product2.price_cents

        self.assertIn("id", data)
        self.assertEqual(data["order_type"], "pickup")
        self.assertEqual(data["status"], Order.Status.PENDING)
        self.assertEqual(data["subtotal_cents"], expected_subtotal)
        self.assertEqual(data["tax_cents"], 0)
        self.assertEqual(data["total_cents"], expected_subtotal)
        self.assertEqual(len(data["items"]), 2)

        items_by_product = {item["product_id"]: item for item in data["items"]}
        item1 = items_by_product[product1.id]
        self.assertEqual(item1["product_name"], product1.name)
        self.assertEqual(item1["quantity"], 2)
        self.assertEqual(item1["unit_price_cents"], product1.price_cents)
        self.assertEqual(item1["total_cents"], product1.price_cents * 2)

        item2 = items_by_product[product2.id]
        self.assertEqual(item2["product_name"], product2.name)
        self.assertEqual(item2["quantity"], 1)
        self.assertEqual(item2["unit_price_cents"], product2.price_cents)
        self.assertEqual(item2["total_cents"], product2.price_cents)

        order = Order.objects.get(pk=data["id"])
        self.assertEqual(order.subtotal_cents, expected_subtotal)
        self.assertEqual(order.total_cents, expected_subtotal)
        self.assertEqual(order.order_type, Order.OrderType.PICKUP)
        self.assertEqual(order.items.count(), 2)
        self.assertEqual(order.pickup_location, payload["pickup_location"])
        self.assertEqual(
            order.pickup_instructions, payload["pickup_instructions"]
        )

    def test_create_delivery_order_with_address(self):
        product = Product.objects.create(
            name="Cheese", slug="cheese", price_cents=1500
        )
        payload = {
            "full_name": "Grace Hopper",
            "email": "grace@example.com",
            "phone": "555-5555",
            "order_type": "delivery",
            "items": [{"product_id": product.id, "quantity": 3}],
            "address": {
                "line1": "123 Main St",
                "city": "Metropolis",
                "postal_code": "12345",
            },
            "delivery_notes": "Leave at door",
        }

        response = self.client.post(
            self.order_list_url, payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        data = response.data

        self.assertEqual(data["order_type"], "delivery")
        self.assertEqual(data["status"], Order.Status.PENDING)
        self.assertEqual(data["address_line1"], payload["address"]["line1"])
        self.assertEqual(data["city"], payload["address"]["city"])
        self.assertEqual(data["postal_code"], payload["address"]["postal_code"])

        order = Order.objects.get(pk=data["id"])
        self.assertEqual(order.address_line1, payload["address"]["line1"])
        self.assertEqual(order.city, payload["address"]["city"])
        self.assertEqual(order.postal_code, payload["address"]["postal_code"])

    def test_delivery_order_requires_address_fields(self):
        product = Product.objects.create(
            name="Ice Cream", slug="ice-cream", price_cents=500
        )
        payload = {
            "full_name": "No Address",
            "email": "noaddress@example.com",
            "phone": "000-0000",
            "order_type": "delivery",
            "items": [{"product_id": product.id, "quantity": 1}],
            "address": {"line1": "", "city": "", "postal_code": ""},
        }

        response = self.client.post(
            self.order_list_url, payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        error_message = " ".join(
            response.data.get("non_field_errors", [])
        ) or str(response.data)
        self.assertIn("Delivery requires", error_message)

    def test_create_order_with_nonexistent_product_fails(self):
        payload = {
            "full_name": "Ghost Product",
            "email": "ghost@example.com",
            "phone": "111-2222",
            "order_type": "pickup",
            "items": [{"product_id": 999999, "quantity": 1}],
        }

        response = self.client.post(
            self.order_list_url, payload, format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("unavailable", str(response.data).lower())

    def test_get_order_detail(self):
        product = Product.objects.create(
            name="Butter", slug="butter", price_cents=1800
        )
        order = Order.objects.create(
            full_name="Detail User",
            email="detail@example.com",
            phone="999-9999",
            order_type=Order.OrderType.DELIVERY,
            status=Order.Status.IN_PROGRESS,
            address_line1="456 High St",
            city="Gotham",
            postal_code="67890",
            notes="Handle with care",
            delivery_notes="Call on arrival",
            pickup_location="",
            pickup_instructions="",
            subtotal_cents=5400,
            tax_cents=0,
            total_cents=5400,
        )
        item = order.items.create(
            product=product,
            product_name=product.name,
            quantity=3,
            unit_price_cents=product.price_cents,
            total_cents=product.price_cents * 3,
        )

        url = reverse("order-detail", args=[order.pk])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        self.assertEqual(data["id"], order.id)
        self.assertEqual(data["full_name"], order.full_name)
        self.assertEqual(data["email"], order.email)
        self.assertEqual(data["phone"], order.phone)
        self.assertEqual(data["order_type"], order.order_type)
        self.assertEqual(data["status"], order.status)
        self.assertEqual(data["subtotal_cents"], order.subtotal_cents)
        self.assertEqual(data["tax_cents"], order.tax_cents)
        self.assertEqual(data["total_cents"], order.total_cents)
        self.assertEqual(data["address_line1"], order.address_line1)
        self.assertEqual(data["city"], order.city)
        self.assertEqual(data["postal_code"], order.postal_code)
        self.assertEqual(data["notes"], order.notes)
        self.assertEqual(data["delivery_notes"], order.delivery_notes)
        self.assertEqual(data["pickup_location"], order.pickup_location)
        self.assertEqual(
            data["pickup_instructions"], order.pickup_instructions
        )
        self.assertIn("items", data)
        self.assertEqual(len(data["items"]), 1)

        line = data["items"][0]
        self.assertEqual(line["id"], item.id)
        self.assertEqual(line["product_id"], product.id)
        self.assertEqual(line["product_name"], product.name)
        self.assertEqual(line["quantity"], item.quantity)
        self.assertEqual(line["unit_price_cents"], item.unit_price_cents)
        self.assertEqual(line["total_cents"], item.total_cents)

    def test_totals_match_line_items(self):
        product1 = Product.objects.create(
            name="Yogurt", slug="yogurt", price_cents=300
        )
        product2 = Product.objects.create(
            name="Juice", slug="juice", price_cents=700
        )
        order = Order.objects.create(
            full_name="Totals Tester",
            email="totals@example.com",
            phone="321-4321",
            order_type=Order.OrderType.PICKUP,
            status=Order.Status.PAID,
            subtotal_cents=0,
            tax_cents=150,
            total_cents=0,
        )
        item1 = order.items.create(
            product=product1,
            product_name=product1.name,
            quantity=2,
            unit_price_cents=product1.price_cents,
            total_cents=product1.price_cents * 2,
        )
        item2 = order.items.create(
            product=product2,
            product_name=product2.name,
            quantity=1,
            unit_price_cents=product2.price_cents,
            total_cents=product2.price_cents,
        )
        order.subtotal_cents = item1.total_cents + item2.total_cents
        order.total_cents = order.subtotal_cents + order.tax_cents
        order.save(update_fields=["subtotal_cents", "total_cents"])

        url = reverse("order-detail", args=[order.pk])
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.data

        calculated_subtotal = sum(item["total_cents"] for item in data["items"])
        self.assertEqual(data["subtotal_cents"], calculated_subtotal)
        self.assertEqual(
            data["total_cents"], data["subtotal_cents"] + data["tax_cents"]
        )
