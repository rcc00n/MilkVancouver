from django.urls import path

from accounts.api import (
    LoginView,
    MeView,
    ProfileView,
    RegisterView,
    RequestEmailVerificationView,
    RequestPhoneVerificationView,
    VerifyEmailView,
    VerifyPhoneView,
)


urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("me/", MeView.as_view(), name="auth-me"),
    path("profile/", ProfileView.as_view(), name="customer-profile"),
    path("request-email-verification/", RequestEmailVerificationView.as_view(), name="request-email-verification"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify-email"),
    path("request-phone-verification/", RequestPhoneVerificationView.as_view(), name="request-phone-verification"),
    path("verify-phone/", VerifyPhoneView.as_view(), name="verify-phone"),
]
