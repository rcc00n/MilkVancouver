from django.utils import timezone
from rest_framework import generics
from rest_framework.pagination import PageNumberPagination

from .models import BlogPost
from .serializers import BlogPostDetailSerializer, BlogPostListSerializer


class BlogPostPagination(PageNumberPagination):
    page_size = 6
    page_size_query_param = "page_size"
    max_page_size = 50

    def get_page_size(self, request):
        limit = request.query_params.get("limit")
        if limit:
            try:
                limit_value = int(limit)
                if limit_value > 0:
                    return min(limit_value, self.max_page_size)
            except (TypeError, ValueError):
                pass
        return super().get_page_size(request)


class BlogPostListView(generics.ListAPIView):
    serializer_class = BlogPostListSerializer
    pagination_class = BlogPostPagination

    def get_queryset(self):
        return (
            BlogPost.objects.filter(is_published=True, published_at__lte=timezone.now())
            .order_by("-published_at", "-id")
            .all()
        )


class BlogPostDetailView(generics.RetrieveAPIView):
    serializer_class = BlogPostDetailSerializer
    lookup_field = "slug"

    def get_queryset(self):
        return (
            BlogPost.objects.filter(is_published=True, published_at__lte=timezone.now())
            .order_by("-published_at", "-id")
            .all()
        )
