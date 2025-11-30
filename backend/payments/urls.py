from django.urls import path

from .api import CheckoutView
from .stripe_api import stripe_config
from .webhooks import StripeWebhookView

urlpatterns = [
    path("payments/config/", stripe_config, name="stripe-config"),
    path("payments/checkout/", CheckoutView.as_view(), name="payments-checkout"),
    path("checkout/", CheckoutView.as_view(), name="checkout"),
    path("webhooks/stripe/", StripeWebhookView.as_view(), name="stripe-webhook"),
]
