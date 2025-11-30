from django.contrib import admin

from accounts.models import CustomerProfile


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "first_name",
        "last_name",
        "phone",
        "city",
        "region_code",
        "email_verified_at",
        "phone_verified_at",
    )
    search_fields = ("user__username", "user__email", "first_name", "last_name", "phone")
    list_select_related = ("user",)
