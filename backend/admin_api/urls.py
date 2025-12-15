from django.urls import path

from .api import (
    AdminClientsView,
    AdminDashboardView,
    AdminRouteDetailView,
    AdminRouteListView,
    AdminRouteMergeView,
    AdminRouteGenerateView,
    AdminRouteOptimizeView,
    AdminRouteReorderView,
)

app_name = "admin_api"

urlpatterns = [
    path("dashboard/", AdminDashboardView.as_view(), name="dashboard"),
    path("clients/", AdminClientsView.as_view(), name="clients"),
    path("routes/", AdminRouteListView.as_view(), name="routes-list"),
    path("routes/<int:pk>/", AdminRouteDetailView.as_view(), name="routes-detail"),
    path("routes/generate/", AdminRouteGenerateView.as_view(), name="routes-generate"),
    path("routes/optimize/", AdminRouteOptimizeView.as_view(), name="routes-optimize"),
    path("routes/<int:pk>/reorder/", AdminRouteReorderView.as_view(), name="routes-reorder"),
    path("routes/merge/", AdminRouteMergeView.as_view(), name="routes-merge"),
]
