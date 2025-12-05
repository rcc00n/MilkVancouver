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
    operating_weekdays = models.JSONField(
        default=list,
        blank=True,
        help_text="Weekdays the driver is normally available (0=Mon ... 6=Sun)",
    )
    preferred_region = models.ForeignKey(
        Region,
        null=True,
        blank=True,
        related_name="preferred_drivers",
        on_delete=models.SET_NULL,
        help_text="Recommended primary direction/region for this driver",
    )
    min_stops_for_dedicated_route = models.PositiveIntegerField(
        default=0,
        help_text=(
            "Minimum stops before we keep this driver separate. "
            "Below this, dispatch can merge with another route."
        ),
    )

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

    def formatted_weekdays(self):
        if not self.operating_weekdays:
            return ""
        weekday_map = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        labels = []
        for value in sorted({int(day) for day in self.operating_weekdays}):
            if 0 <= value < len(weekday_map):
                labels.append(weekday_map[value])
        return ", ".join(labels)


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
    merged_into = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        related_name="merged_children",
        on_delete=models.SET_NULL,
    )
    merged_at = models.DateTimeField(null=True, blank=True)
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
        merged_hint = " (merged)" if self.merged_into_id else ""
        return f"Route {self.region.code} on {self.date} - {driver_display}{merged_hint}"

    def refresh_completion_status(self, save: bool = True) -> None:
        """
        Mark route as completed if all stops are either delivered or no_pickup.
        """
        completed = not self.stops.exclude(
            status__in=[RouteStop.Status.DELIVERED, RouteStop.Status.NO_PICKUP]
        ).exists()

        if self.is_completed != completed:
            self.is_completed = completed
            if save:
                self.save(update_fields=["is_completed"])

    @property
    def stops_count(self):
        annotated_value = getattr(self, "_stops_count", None)
        if annotated_value is not None:
            return annotated_value
        return self.stops.count()

    @stops_count.setter
    def stops_count(self, value):
        self._stops_count = value

    @property
    def is_merged(self) -> bool:
        return bool(self.merged_into_id)


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


class DeliveryProof(models.Model):
    stop = models.OneToOneField(
        RouteStop, related_name="delivery_proof", on_delete=models.CASCADE
    )
    photo = models.ImageField(upload_to="delivery_proofs/")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"DeliveryProof for stop {self.stop_id}"
