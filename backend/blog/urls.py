from django.urls import path

from .api import BlogPostDetailView, BlogPostListView

urlpatterns = [
    path("blog/posts/", BlogPostListView.as_view(), name="blogpost-list"),
    path("blog/posts/<slug:slug>/", BlogPostDetailView.as_view(), name="blogpost-detail"),
]
