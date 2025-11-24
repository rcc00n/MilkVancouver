from django.contrib import admin

from .models import BlogPost


@admin.register(BlogPost)
class BlogPostAdmin(admin.ModelAdmin):
    list_display = ("title", "author", "published_at", "is_published")
    list_filter = ("is_published",)
    search_fields = ("title", "slug", "author")
    prepopulated_fields = {"slug": ("title",)}

# Register your models here.
