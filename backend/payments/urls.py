from django.urls import path

from .stripe_api import CreatePaymentIntentView
from .webhooks import StripeWebhookView

urlpatterns = [
    path("payments/intents/", CreatePaymentIntentView.as_view(), name="payment-intent"),
    path("payments/webhooks/stripe/", StripeWebhookView.as_view(), name="stripe-webhook"),
]
