from django.conf import settings
from django.db import models

from orders.models import Order, Region


class Driver(models.Model):
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        related_name="driver_profile",
        on_delete=models.CASCADE,
    )
    phone = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ["user__id"]

    def __str__(self):
        name = self.user.get_full_name() if hasattr(self.user, "get_full_name") else ""
        identifier = (
            name
            or getattr(self.user, "email", "")
            or getattr(self.user, "username", "")
            or str(self.user_id)
        )
        return f"Driver {identifier}"


class DeliveryRoute(models.Model):
    region = models.ForeignKey(
        Region, related_name="routes", on_delete=models.CASCADE
    )
    date = models.DateField()
    driver = models.ForeignKey(
        Driver,
        null=True,
        blank=True,
        related_name="routes",
        on_delete=models.SET_NULL,
    )
    is_completed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-date", "region__code", "id"]
        verbose_name = "Delivery Route"
        verbose_name_plural = "Delivery Routes"
        unique_together = ("region", "date", "driver")

    def __str__(self):
        driver_display = "Unassigned"
        if self.driver:
            driver_name = (
                self.driver.user.get_full_name()
                if hasattr(self.driver.user, "get_full_name")
                else ""
            )
            driver_identifier = (
                driver_name
                or getattr(self.driver.user, "email", "")
                or getattr(self.driver.user, "username", "")
                or f"Driver {self.driver_id}"
            )
            driver_display = driver_identifier
        return f"Route {self.region.code} on {self.date} - {driver_display}"

    @property
    def stops_count(self):
        annotated_value = getattr(self, "_stops_count", None)
        if annotated_value is not None:
            return annotated_value
        return self.stops.count()

    @stops_count.setter
    def stops_count(self, value):
        self._stops_count = value


class RouteStop(models.Model):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        DELIVERED = "delivered", "Delivered"
        NO_PICKUP = "no_pickup", "No Pickup"

    route = models.ForeignKey(
        DeliveryRoute, related_name="stops", on_delete=models.CASCADE
    )
    order = models.OneToOneField(
        Order, related_name="route_stop", on_delete=models.CASCADE
    )
    sequence = models.PositiveIntegerField(
        help_text="Ordering of stops in this route."
    )
    status = models.CharField(
        max_length=20, choices=Status.choices, default=Status.PENDING
    )
    delivered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["sequence"]
        unique_together = ("route", "sequence")

    def __str__(self):
        return f"Stop #{self.sequence} for order #{self.order_id} on route {self.route_id}"
