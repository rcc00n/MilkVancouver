from django.contrib import admin

from .models import ContactMessage, QuoteRequest


@admin.register(QuoteRequest)
class QuoteRequestAdmin(admin.ModelAdmin):
    list_display = ("name", "phone", "email", "fulfillment", "created_at")
    search_fields = ("name", "phone", "email", "message")
    list_filter = ("fulfillment", "created_at")


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("name", "email", "phone", "created_at")
    search_fields = ("name", "email", "phone", "message")
    date_hierarchy = "created_at"
