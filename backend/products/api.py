from rest_framework import filters, viewsets
from django.db import models

from .models import Category, Product
from .serializers import CategorySerializer, ProductSerializer


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "category__name"]
    lookup_field = "slug"

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get("category")

        if category:
            queryset = queryset.filter(
                models.Q(category__slug__iexact=category)
                | models.Q(category__name__iexact=category)
            )

        return queryset


class CategoryViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Category.objects.all().order_by("name")
    serializer_class = CategorySerializer
