from django.urls import path

from .stripe_api import create_checkout, stripe_config
from .webhooks import StripeWebhookView

urlpatterns = [
    path("payments/config/", stripe_config, name="stripe-config"),
    path("checkout/", create_checkout, name="checkout"),
    path("webhooks/stripe/", StripeWebhookView.as_view(), name="stripe-webhook"),
]
