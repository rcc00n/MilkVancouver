from django.urls import path

from .api import OrderDetailView, OrderListView, RegionListView

urlpatterns = [
    path("orders/", OrderListView.as_view(), name="order-list"),
    path("orders/<int:pk>/", OrderDetailView.as_view(), name="order-detail"),
    path("regions/", RegionListView.as_view(), name="region-list"),
]
