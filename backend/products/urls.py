from django.urls import path

from .api import ProductListView

urlpatterns = [
    path("products/", ProductListView.as_view(), name="product-list"),
]
