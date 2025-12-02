import shutil
import tempfile
from datetime import date
from uuid import uuid4

from django.conf import settings
from django.contrib import admin
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, override_settings
from django.urls import reverse

from delivery.models import DeliveryProof, DeliveryRoute, Driver, RouteStop
from notifications.models import EmailNotification
from orders.models import Order, Region
from payments.models import Payment
from products.models import Product


@override_settings(
    ROOT_URLCONF="tests.urlconf",
    DEFAULT_FILE_STORAGE="django.core.files.storage.FileSystemStorage",
    STATICFILES_STORAGE="django.contrib.staticfiles.storage.StaticFilesStorage",
    STORAGES={
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {
            "BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"
        },
    },
)
class AdminDay16Tests(TestCase):
    def setUp(self):
        self.temp_media = tempfile.mkdtemp()
        self.addCleanup(shutil.rmtree, self.temp_media, ignore_errors=True)
        old_media_root = settings.MEDIA_ROOT
        settings.MEDIA_ROOT = self.temp_media
        self.addCleanup(setattr, settings, "MEDIA_ROOT", old_media_root)

        User = get_user_model()
        self.password = "password123"
        unique_suffix = uuid4().hex[:6]
        self.superuser = User.objects.create_superuser(
            username=f"admin-{unique_suffix}",
            email=f"admin-{unique_suffix}@example.com",
            password=self.password,
        )
        self.client.login(username=self.superuser.username, password=self.password)

        region_code = f"region-{unique_suffix}"
        self.region = Region.objects.create(
            code=region_code, name="North", delivery_weekday=1, min_orders=0
        )

        product_suffix = uuid4().hex[:6]
        self.product_with_image = Product.objects.create(
            name="Product With Image",
            slug=f"product-with-image-{product_suffix}",
            description="",
            price_cents=1234,
            image=SimpleUploadedFile(
                "product.jpg", b"fake-image-content", content_type="image/jpeg"
            ),
            main_image_url="",
            category="dairy",
            is_popular=False,
            is_active=True,
        )
        self.product_without_image = Product.objects.create(
            name="Product Without Image",
            slug=f"product-without-image-{product_suffix}",
            description="",
            price_cents=1500,
            main_image_url="",
            category="dairy",
            is_popular=False,
            is_active=False,
        )

        self.order_with_receipt = Order.objects.create(
            full_name="Order One",
            email="one@example.com",
            phone="111-222-3333",
            order_type=Order.OrderType.DELIVERY,
            status=Order.Status.PENDING,
            region=self.region,
        )
        self.order_without_receipt = Order.objects.create(
            full_name="Order Two",
            email="two@example.com",
            phone="222-333-4444",
            order_type=Order.OrderType.PICKUP,
            status=Order.Status.PENDING,
            region=self.region,
        )

        self.payment = Payment.objects.create(
            order=self.order_with_receipt,
            provider=Payment.Provider.STRIPE,
            kind=Payment.Kind.CHARGE,
            amount_cents=1234,
            currency="cad",
            status=Payment.Status.SUCCEEDED,
        )

        self.notification_with_pdf = EmailNotification.objects.create(
            order=self.order_with_receipt,
            kind="order_receipt",
            to_email="one@example.com",
            receipt_pdf=SimpleUploadedFile(
                "receipt.pdf", b"pdf-content", content_type="application/pdf"
            ),
        )
        self.notification_without_pdf = EmailNotification.objects.create(
            order=self.order_without_receipt,
            kind="order_receipt",
            to_email="two@example.com",
        )

        driver_suffix = uuid4().hex[:6]
        driver_user = User.objects.create_user(
            username=f"driver-{driver_suffix}",
            email=f"driver-{driver_suffix}@example.com",
            password=self.password,
        )
        self.driver = Driver.objects.create(user=driver_user, phone="555-0000")
        self.route = DeliveryRoute.objects.create(
            region=self.region, date=date.today(), driver=self.driver
        )
        self.route_stop_with_photo = RouteStop.objects.create(
            route=self.route,
            order=self.order_with_receipt,
            sequence=1,
            status=RouteStop.Status.PENDING,
        )
        self.route_stop_without_photo = RouteStop.objects.create(
            route=self.route,
            order=self.order_without_receipt,
            sequence=2,
            status=RouteStop.Status.PENDING,
        )
        self.delivery_proof = DeliveryProof.objects.create(
            stop=self.route_stop_with_photo,
            photo=SimpleUploadedFile(
                "proof.jpg", b"proof-content", content_type="image/jpeg"
            ),
        )

    def test_orders_changelist_and_latest_receipt_link(self):
        response = self.client.get(reverse("admin:orders_order_changelist"))
        self.assertEqual(response.status_code, 200)

        order_admin = admin.site._registry[Order]
        link_with_pdf = order_admin.latest_receipt_link(self.order_with_receipt)
        self.assertIn("View receipt", str(link_with_pdf))
        link_without_pdf = order_admin.latest_receipt_link(self.order_without_receipt)
        self.assertIn("—", str(link_without_pdf))

    def test_order_bulk_action_mark_completed(self):
        url = reverse("admin:orders_order_changelist")
        response = self.client.post(
            url,
            {
                "action": "mark_completed",
                "_selected_action": [
                    self.order_with_receipt.pk,
                    self.order_without_receipt.pk,
                ],
            },
            follow=True,
        )
        self.assertEqual(response.status_code, 200)
        self.order_with_receipt.refresh_from_db()
        self.order_without_receipt.refresh_from_db()
        self.assertEqual(self.order_with_receipt.status, Order.Status.COMPLETED)
        self.assertEqual(self.order_without_receipt.status, Order.Status.COMPLETED)

    def test_payment_amount_display_formats_dollars(self):
        payment_admin = admin.site._registry[Payment]
        self.assertEqual(payment_admin.amount_display(self.payment), "$12.34")

    def test_delivery_admin_changelists_and_helpers(self):
        for url_name in (
            "admin:delivery_deliveryroute_changelist",
            "admin:delivery_routestop_changelist",
            "admin:delivery_deliveryproof_changelist",
        ):
            response = self.client.get(reverse(url_name))
            self.assertEqual(response.status_code, 200)

        route_stop_admin = admin.site._registry[RouteStop]
        self.assertEqual(
            route_stop_admin.region(self.route_stop_with_photo), self.region
        )
        self.assertEqual(
            route_stop_admin.driver(self.route_stop_with_photo), self.driver
        )

    def test_delivery_proof_thumbnail_renders_img_and_fallback(self):
        proof_admin = admin.site._registry[DeliveryProof]
        html_with_photo = proof_admin.thumbnail(self.delivery_proof)
        self.assertIn("<img", str(html_with_photo))

        empty_proof = DeliveryProof(stop=self.route_stop_without_photo)
        fallback = proof_admin.thumbnail(empty_proof)
        self.assertIn("—", str(fallback))

    def test_product_admin_image_preview_and_changelist(self):
        response = self.client.get(reverse("admin:products_product_changelist"))
        self.assertEqual(response.status_code, 200)

        product_admin = admin.site._registry[Product]
        self.assertIn("<img", str(product_admin.image_preview(self.product_with_image)))
        self.assertEqual(
            "No image", product_admin.image_preview(self.product_without_image)
        )

    def test_notification_admin_receipt_link_and_changelist(self):
        response = self.client.get(
            reverse("admin:notifications_emailnotification_changelist")
        )
        self.assertEqual(response.status_code, 200)

        notification_admin = admin.site._registry[EmailNotification]
        self.assertIn(
            "<a", str(notification_admin.receipt_link(self.notification_with_pdf))
        )
        self.assertIn(
            "—", str(notification_admin.receipt_link(self.notification_without_pdf))
        )
