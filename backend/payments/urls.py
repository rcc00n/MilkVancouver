from django.urls import path

from .stripe_api import create_checkout
from .webhooks import StripeWebhookView

urlpatterns = [
    path("checkout/", create_checkout, name="checkout"),
    path("webhooks/stripe/", StripeWebhookView.as_view(), name="stripe-webhook"),
]
