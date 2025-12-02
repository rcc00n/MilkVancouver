import datetime

from django.db.models import Count
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from delivery.models import DeliveryRoute, Driver, RouteStop
from delivery.permissions import IsDriver
from delivery.serializers import (
    DeliveryRouteSerializer,
    DriverRouteSerializer,
    DriverUpcomingRouteSerializer,
    RouteStopSerializer,
)


class MyRoutesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        driver = Driver.objects.filter(user=request.user).select_related("user").first()
        if not driver:
            return Response(
                {"detail": "You are not registered as a driver."},
                status=status.HTTP_403_FORBIDDEN,
            )

        date_param = request.query_params.get("date")
        if date_param:
            try:
                date_value = datetime.date.fromisoformat(date_param)
            except ValueError:
                return Response(
                    {"detail": "Invalid date format. Use YYYY-MM-DD."},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            date_value = timezone.now().date()

        routes = (
            DeliveryRoute.objects.filter(driver=driver, date=date_value)
            .select_related("region", "driver", "driver__user")
            .prefetch_related("stops", "stops__order")
        )
        serializer = DeliveryRouteSerializer(routes, many=True)
        return Response(serializer.data)


class DriverTodayRoutesView(APIView):
    permission_classes = [IsDriver, permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if not request.user or not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        driver = Driver.objects.filter(user=request.user).first()
        if not driver:
            return Response(
                {"detail": "You are not registered as a driver."},
                status=status.HTTP_403_FORBIDDEN,
            )

        today = timezone.now().date()
        routes = (
            DeliveryRoute.objects.filter(driver=driver, date=today)
            .select_related("region", "driver", "driver__user")
            .prefetch_related("stops", "stops__order")
            .order_by("region__code", "id")
        )
        serializer = DriverRouteSerializer(routes, many=True)
        return Response(serializer.data)


class DriverUpcomingRoutesView(APIView):
    permission_classes = [IsDriver, permissions.IsAuthenticated]

    def get(self, request, *args, **kwargs):
        if not request.user or not request.user.is_authenticated:
            return Response(
                {"detail": "Authentication credentials were not provided."},
                status=status.HTTP_401_UNAUTHORIZED,
            )

        driver = Driver.objects.filter(user=request.user).first()
        if not driver:
            return Response(
                {"detail": "You are not registered as a driver."},
                status=status.HTTP_403_FORBIDDEN,
            )

        today = timezone.now().date()
        routes = (
            DeliveryRoute.objects.filter(
                driver=driver,
                date__gt=today,
                is_completed=False,
            )
            .select_related("region")
            .annotate(stops_count=Count("stops"))
            .order_by("date", "region__code", "id")
        )
        serializer = DriverUpcomingRouteSerializer(routes, many=True)
        return Response(serializer.data)


class RouteStopsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, route_id, *args, **kwargs):
        route = get_object_or_404(
            DeliveryRoute.objects.select_related("driver__user"), pk=route_id
        )
        if not (
            request.user.is_staff
            or (route.driver and route.driver.user_id == request.user.id)
        ):
            return Response(
                {"detail": "You do not have permission to view this route."},
                status=status.HTTP_403_FORBIDDEN,
            )

        stops = route.stops.select_related("order").order_by("sequence")
        serializer = RouteStopSerializer(stops, many=True)
        return Response(serializer.data)
