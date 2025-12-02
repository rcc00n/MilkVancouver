from django.urls import path

from .api import (
    DriverTodayRoutesView,
    DriverUpcomingRoutesView,
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
]
