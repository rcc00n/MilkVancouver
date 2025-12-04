from django.contrib import admin
from django.utils.html import format_html

from .models import SiteImage


@admin.register(SiteImage)
class SiteImageAdmin(admin.ModelAdmin):
    list_display = ("key", "thumbnail", "alt_text", "updated_at")
    search_fields = ("key", "alt_text", "description")
    readonly_fields = ("preview", "created_at", "updated_at")
    fieldsets = (
        (None, {"fields": ("key", "image", "alt_text", "description")}),
        ("Preview", {"fields": ("preview",)}),
        ("Metadata", {"fields": ("created_at", "updated_at")}),
    )

    def thumbnail(self, obj: SiteImage):
        if obj.image:
            return format_html('<img src="{}" style="height:40px;width:40px;object-fit:cover;border-radius:8px;" />', obj.image.url)
        return "—"

    thumbnail.short_description = "Image"

    def preview(self, obj: SiteImage):
        if obj.image:
            return format_html('<img src="{}" style="max-height:200px;border-radius:12px;" />', obj.image.url)
        return "No image uploaded"

