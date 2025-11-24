from django.urls import path

from .api import OrderListView

urlpatterns = [
    path("orders/", OrderListView.as_view(), name="order-list"),
]
