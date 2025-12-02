from django.contrib import admin
from django.utils.html import format_html

from .models import EmailNotification


@admin.register(EmailNotification)
class EmailNotificationAdmin(admin.ModelAdmin):
    list_display = (
        "order",
        "kind",
        "to_email",
        "status",
        "error",
        "created_at",
        "sent_at",
        "receipt_link",
    )
    list_filter = ("kind", "status")
    search_fields = ("order__id", "to_email", "kind", "status")
    readonly_fields = (
        "receipt_link",
        "created_at",
        "updated_at",
        "sent_at",
        "receipt_pdf",
    )

    def receipt_link(self, obj):
        if obj.receipt_pdf:
            return format_html(
                '<a href="{}" target="_blank" rel="noopener">View receipt</a>',
                obj.receipt_pdf.url,
            )
        return "—"

    receipt_link.short_description = "Receipt PDF"
