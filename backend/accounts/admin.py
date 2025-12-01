from django.contrib import admin

from accounts.models import CustomerProfile, EmailVerificationToken, PhoneVerification


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


@admin.register(EmailVerificationToken)
class EmailVerificationTokenAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "truncated_token",
        "created_at",
        "expires_at",
        "used_at",
        "is_active",
    )
    list_filter = ("expires_at", "used_at", "user")
    readonly_fields = ("token", "created_at", "used_at", "is_active")
    search_fields = ("token", "user__username", "user__email")
    list_select_related = ("user",)

    @admin.display(description="Token", ordering="token")
    def truncated_token(self, obj):
        token = obj.token or ""
        if len(token) <= 16:
            return token
        return f"{token[:8]}...{token[-4:]}"

    @admin.display(boolean=True, description="Is active")
    def is_active(self, obj):
        return obj.is_active


@admin.register(PhoneVerification)
class PhoneVerificationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "phone_number",
        "created_at",
        "expires_at",
        "verified_at",
        "attempts",
    )
    search_fields = ("user__username", "user__email", "phone_number")
    list_select_related = ("user",)
