from rest_framework import filters, viewsets

from .models import Product
from .serializers import ProductSerializer


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Product.objects.filter(is_active=True)
    serializer_class = ProductSerializer
    filter_backends = [filters.SearchFilter]
    search_fields = ["name", "category"]
    lookup_field = "slug"

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get("category")

        if category:
            queryset = queryset.filter(category__iexact=category)

        return queryset
