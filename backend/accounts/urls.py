from django.urls import path

from accounts.api import LoginView, MeView, ProfileView, RegisterView


urlpatterns = [
    path("auth/register/", RegisterView.as_view(), name="auth-register"),
    path("auth/login/", LoginView.as_view(), name="auth-login"),
    path("auth/me/", MeView.as_view(), name="auth-me"),
    path("profile/", ProfileView.as_view(), name="customer-profile"),
]
