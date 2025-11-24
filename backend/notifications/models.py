from django.db import models


class EmailNotification(models.Model):
    STATUS_CHOICES = [
        ("pending", "Pending"),
        ("sent", "Sent"),
        ("failed", "Failed"),
    ]

    order = models.ForeignKey(
        "orders.Order",
        related_name="email_notifications",
        on_delete=models.CASCADE,
    )
    kind = models.CharField(max_length=50)
    to_email = models.EmailField()
    subject = models.CharField(max_length=255)
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default="pending"
    )
    receipt_pdf = models.FileField(
        upload_to="receipts/",
        blank=True,
        null=True,
        help_text="Stored order receipt PDF",
    )
    message_id = models.CharField(max_length=255, blank=True)
    error = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"EmailNotification #{self.id} ({self.kind}) -> {self.to_email}"
