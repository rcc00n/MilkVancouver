from django.urls import path

from .views import SiteImageDetailView, SiteImageListView

app_name = "content"

urlpatterns = [
    path("site-images/", SiteImageListView.as_view(), name="site-image-list"),
    path("site-images/<str:key>/", SiteImageDetailView.as_view(), name="site-image-detail"),
]
