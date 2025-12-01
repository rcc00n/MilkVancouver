from django.urls import path

from .api import MyRoutesView, RouteStopsView

app_name = "delivery"

urlpatterns = [
    path("my-routes/", MyRoutesView.as_view(), name="my-routes"),
    path("routes/<int:route_id>/stops/", RouteStopsView.as_view(), name="route-stops"),
]
