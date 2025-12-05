from django.urls import path

from .api import (
    DriverTodayRoutesView,
    DriverUpcomingRoutesView,
    DriverRouteDetailView,
    MarkStopDeliveredView,
    MarkStopNoPickupView,
    MyRoutesView,
    RouteStopsView,
)

app_name = "delivery"

urlpatterns = [
    path("my-routes/", MyRoutesView.as_view(), name="my-routes"),
    path("routes/<int:route_id>/stops/", RouteStopsView.as_view(), name="route-stops"),
    path(
        "driver/routes/today/",
        DriverTodayRoutesView.as_view(),
        name="driver-routes-today",
    ),
    path(
        "driver/routes/upcoming/",
        DriverUpcomingRoutesView.as_view(),
        name="driver-routes-upcoming",
    ),
    path(
        "driver/routes/<int:route_id>/",
        DriverRouteDetailView.as_view(),
        name="driver-route-detail",
    ),
    path(
        "driver/stops/<int:stop_id>/mark-delivered/",
        MarkStopDeliveredView.as_view(),
        name="driver-stop-mark-delivered",
    ),
    path(
        "driver/stops/<int:stop_id>/mark-no-pickup/",
        MarkStopNoPickupView.as_view(),
        name="driver-stop-mark-no-pickup",
    ),
]
