from django.contrib import admin
from django.utils.html import format_html

from .models import Category, Product, ProductImage


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ("image_url", "alt_text", "sort_order")


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "price_display",
        "is_popular",
        "is_active",
        "image_preview",
    )
    list_filter = ("category", "is_popular", "is_active")
    search_fields = ("name", "slug", "category__name")
    prepopulated_fields = {"slug": ("name",)}
    readonly_fields = ("image_preview",)
    list_editable = ("is_popular", "is_active")
    autocomplete_fields = ("category",)
    fields = (
        "name",
        "slug",
        "description",
        "price_cents",
        "image",
        "main_image_url",
        "category",
        "is_popular",
        "is_active",
        "image_preview",
    )
    inlines = [ProductImageInline]

    def image_preview(self, obj):
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 150px; border-radius: 8px;" />',
                obj.image.url,
            )
        return "No image"

    image_preview.short_description = "Preview"

    def price_display(self, obj):
        return f"${obj.price_cents / 100:.2f}"

    price_display.short_description = "Price"
    price_display.admin_order_field = "price_cents"


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "slug")
    search_fields = ("name", "slug")
    prepopulated_fields = {"slug": ("name",)}
