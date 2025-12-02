import tempfile

from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APIClient, APITestCase

from delivery.models import DeliveryProof, DeliveryRoute, Driver, RouteStop
from orders.models import Order, Region


@override_settings(
    DEFAULT_FILE_STORAGE="django.core.files.storage.FileSystemStorage",
    STORAGES={
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    },
    MEDIA_ROOT=tempfile.mkdtemp(),
)
class DriverProofOfDeliveryAPITestCase(APITestCase):
    def setUp(self):
        self.client = APIClient()
        self.user_counter = 0

    def create_user(self, username_prefix="user"):
        self.user_counter += 1
        username = f"{username_prefix}{self.user_counter}"
        email = f"{username}@example.com"
        return get_user_model().objects.create_user(
            username=username,
            email=email,
            password="testpass123",
        )

    def create_driver(self, user=None):
        user = user or self.create_user("driver")
        return Driver.objects.create(user=user)

    def create_region(self, code="R1", name="Region 1", delivery_weekday=1):
        return Region.objects.create(
            code=code,
            name=name,
            delivery_weekday=delivery_weekday,
        )

    def create_order(self, region, status_value=Order.Status.PENDING):
        return Order.objects.create(
            full_name="John Doe",
            email="john@example.com",
            phone="123456789",
            address_line1="123 Main St",
            city="Townsville",
            postal_code="12345",
            region=region,
            order_type=Order.OrderType.DELIVERY,
            status=status_value,
        )

    def create_route(self, region, driver, date=None, is_completed=False):
        return DeliveryRoute.objects.create(
            region=region,
            driver=driver,
            date=date or timezone.now().date(),
            is_completed=is_completed,
        )

    def create_stop(self, route, order, sequence=1, status_value=RouteStop.Status.PENDING):
        return RouteStop.objects.create(
            route=route,
            order=order,
            sequence=sequence,
            status=status_value,
        )

    def test_driver_can_mark_own_stop_as_delivered_with_photo(self):
        driver = self.create_driver()
        region = self.create_region()
        route = self.create_route(region=region, driver=driver)
        order = self.create_order(region=region)
        stop = self.create_stop(route=route, order=order, sequence=1)

        self.client.force_authenticate(user=driver.user)
        url = reverse("delivery:driver-stop-mark-delivered", args=[stop.id])
        photo = SimpleUploadedFile("proof.jpg", b"filecontent", content_type="image/jpeg")
        response = self.client.post(url, data={"photo": photo}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        data = response.json()
        self.assertEqual(data["status"], RouteStop.Status.DELIVERED)
        self.assertTrue(data["has_proof"])

        self.assertTrue(DeliveryProof.objects.filter(stop=stop).exists())

        stop.refresh_from_db()
        self.assertEqual(stop.status, RouteStop.Status.DELIVERED)
        self.assertIsNotNone(stop.delivered_at)

        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.COMPLETED)
        self.assertIsNotNone(order.delivered_at)

        route.refresh_from_db()
        self.assertTrue(route.is_completed)

    def test_photo_is_required_for_mark_delivered(self):
        driver = self.create_driver()
        region = self.create_region(code="R2", name="Region 2")
        route = self.create_route(region=region, driver=driver)
        order = self.create_order(region=region)
        stop = self.create_stop(route=route, order=order, sequence=1)

        self.client.force_authenticate(user=driver.user)
        url = reverse("delivery:driver-stop-mark-delivered", args=[stop.id])
        response = self.client.post(url, data={}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(DeliveryProof.objects.filter(stop=stop).exists())

        stop.refresh_from_db()
        self.assertEqual(stop.status, RouteStop.Status.PENDING)
        self.assertIsNone(stop.delivered_at)

        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.PENDING)
        self.assertIsNone(order.delivered_at)

        route.refresh_from_db()
        self.assertFalse(route.is_completed)

    def test_driver_cannot_modify_stop_of_another_driver(self):
        driver_a = self.create_driver()
        driver_b = self.create_driver()
        region = self.create_region(code="R3", name="Region 3")
        route = self.create_route(region=region, driver=driver_b)
        order = self.create_order(region=region)
        stop = self.create_stop(route=route, order=order, sequence=1)

        self.client.force_authenticate(user=driver_a.user)
        delivered_url = reverse("delivery:driver-stop-mark-delivered", args=[stop.id])
        no_pickup_url = reverse("delivery:driver-stop-mark-no-pickup", args=[stop.id])

        photo = SimpleUploadedFile("proof.jpg", b"filecontent", content_type="image/jpeg")
        delivered_response = self.client.post(
            delivered_url, data={"photo": photo}, format="multipart"
        )
        no_pickup_response = self.client.post(no_pickup_url, data={})

        self.assertEqual(delivered_response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(no_pickup_response.status_code, status.HTTP_403_FORBIDDEN)

        self.assertFalse(DeliveryProof.objects.filter(stop=stop).exists())

        stop.refresh_from_db()
        self.assertEqual(stop.status, RouteStop.Status.PENDING)
        self.assertIsNone(stop.delivered_at)

        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.PENDING)
        self.assertIsNone(order.delivered_at)

        route.refresh_from_db()
        self.assertFalse(route.is_completed)

    def test_mark_no_pickup_updates_status_without_delivery_proof(self):
        driver = self.create_driver()
        region = self.create_region(code="R4", name="Region 4")
        route = self.create_route(region=region, driver=driver)
        order = self.create_order(region=region)
        stop = self.create_stop(route=route, order=order, sequence=1)

        self.client.force_authenticate(user=driver.user)
        url = reverse("delivery:driver-stop-mark-no-pickup", args=[stop.id])
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        stop.refresh_from_db()
        self.assertEqual(stop.status, RouteStop.Status.NO_PICKUP)
        self.assertIsNotNone(stop.delivered_at)

        order.refresh_from_db()
        self.assertEqual(order.status, Order.Status.IN_PROGRESS)
        self.assertIsNone(order.delivered_at)

        self.assertFalse(DeliveryProof.objects.filter(stop=stop).exists())

        route.refresh_from_db()
        self.assertTrue(route.is_completed)

    def test_route_completion_after_all_stops_finished(self):
        driver = self.create_driver()
        region = self.create_region(code="R5", name="Region 5")
        route = self.create_route(region=region, driver=driver)

        order1 = self.create_order(region=region)
        order2 = self.create_order(region=region)
        order3 = self.create_order(region=region)

        stop1 = self.create_stop(route=route, order=order1, sequence=1)
        stop2 = self.create_stop(route=route, order=order2, sequence=2)
        stop3 = self.create_stop(route=route, order=order3, sequence=3)

        self.client.force_authenticate(user=driver.user)

        def post_delivered(stop):
            url = reverse("delivery:driver-stop-mark-delivered", args=[stop.id])
            photo = SimpleUploadedFile("proof.jpg", b"content", content_type="image/jpeg")
            return self.client.post(url, data={"photo": photo}, format="multipart")

        response1 = post_delivered(stop1)
        self.assertEqual(response1.status_code, status.HTTP_200_OK)
        route.refresh_from_db()
        self.assertFalse(route.is_completed)

        response2 = post_delivered(stop2)
        self.assertEqual(response2.status_code, status.HTTP_200_OK)
        route.refresh_from_db()
        self.assertFalse(route.is_completed)

        no_pickup_url = reverse("delivery:driver-stop-mark-no-pickup", args=[stop3.id])
        response3 = self.client.post(no_pickup_url)
        self.assertEqual(response3.status_code, status.HTTP_200_OK)

        route.refresh_from_db()
        self.assertTrue(route.is_completed)

        stop1.refresh_from_db()
        stop2.refresh_from_db()
        stop3.refresh_from_db()

        self.assertEqual(stop1.status, RouteStop.Status.DELIVERED)
        self.assertIsNotNone(stop1.delivered_at)

        self.assertEqual(stop2.status, RouteStop.Status.DELIVERED)
        self.assertIsNotNone(stop2.delivered_at)

        self.assertEqual(stop3.status, RouteStop.Status.NO_PICKUP)
        self.assertIsNotNone(stop3.delivered_at)

    def test_unauthenticated_requests_are_rejected(self):
        driver = self.create_driver()
        region = self.create_region(code="R6", name="Region 6")
        route = self.create_route(region=region, driver=driver)
        order = self.create_order(region=region)
        stop = self.create_stop(route=route, order=order, sequence=1)

        url = reverse("delivery:driver-stop-mark-delivered", args=[stop.id])
        photo = SimpleUploadedFile("proof.jpg", b"filecontent", content_type="image/jpeg")
        response = self.client.post(url, data={"photo": photo}, format="multipart")

        self.assertIn(response.status_code, (status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN))

        stop.refresh_from_db()
        self.assertEqual(stop.status, RouteStop.Status.PENDING)
