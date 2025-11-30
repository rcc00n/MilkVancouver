from django.db import models


class EmailNotification(models.Model):
    STATUS_PENDING = "pending"
    STATUS_SENT = "sent"
    STATUS_FAILED = "failed"
    STATUS_CHOICES = [
        (STATUS_PENDING, "Pending"),
        (STATUS_SENT, "Sent"),
        (STATUS_FAILED, "Failed"),
    ]

    order = models.ForeignKey(
        "orders.Order",
        related_name="email_notifications",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
    )
    kind = models.CharField(max_length=50)
    to_email = models.EmailField(blank=True)
    subject = models.CharField(max_length=255)
    body_text = models.TextField(blank=True, default="")
    body_html = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING
    )
    error = models.TextField(blank=True, null=True)
    receipt_pdf = models.FileField(
        upload_to="receipts/",
        blank=True,
        null=True,
        help_text="Stored order receipt PDF",
    )
    message_id = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    sent_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"EmailNotification {self.kind} -> {self.to_email or 'unknown'} ({self.status})"
