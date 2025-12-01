from django.urls import path

from payments.stripe_api import create_checkout
from shop import urls as shop_urls

# Extend the main URL configuration with the legacy create_checkout endpoint so
# tests can exercise its behavior alongside the current checkout view.
urlpatterns = [
    *shop_urls.urlpatterns,
    path(
        "api/payments/create-checkout/",
        create_checkout,
        name="payments-create-checkout",
    ),
]
