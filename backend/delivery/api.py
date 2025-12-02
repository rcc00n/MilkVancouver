import datetime
import logging

from django.db.models import Count, Prefetch
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from delivery.models import DeliveryProof, DeliveryRoute, Driver, RouteStop
from delivery.permissions import IsDriver as BaseIsDriver
from delivery.serializers import (
    DeliveryRouteSerializer,
    DriverRouteSerializer,
    DriverUpcomingRouteSerializer,
    RouteStopSerializer,
)
from notifications.tasks import send_order_delivered_email_once
from orders.models import Order

logger = logging.getLogger(__name__)


class IsDriver(BaseIsDriver):
    """
    Permission that checks if the authenticated user is a registered driver.
    """

    pass


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
            .prefetch_related(
                Prefetch(
                    "stops",
                    queryset=RouteStop.objects.select_related("order").order_by(
                        "sequence", "id"
                    ),
                )
            )
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
            .prefetch_related(
                Prefetch(
                    "stops",
                    queryset=RouteStop.objects.select_related("order").order_by(
                        "sequence", "id"
                    ),
                )
            )
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

        stops = route.stops.select_related("order").order_by("sequence", "id")
        serializer = RouteStopSerializer(stops, many=True)
        return Response(serializer.data)


class MarkStopDeliveredView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsDriver]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, stop_id, *args, **kwargs):
        driver = Driver.objects.filter(user=request.user).first()
        if not driver:
            return Response(
                {"detail": IsDriver.message},
                status=status.HTTP_403_FORBIDDEN,
            )

        stop = get_object_or_404(
            RouteStop.objects.select_related("route", "route__driver", "order"),
            pk=stop_id,
        )

        if not stop.route.driver or stop.route.driver_id != driver.id:
            return Response(
                {"detail": "You do not have permission to modify this stop."},
                status=status.HTTP_403_FORBIDDEN,
            )

        uploaded_photo = request.FILES.get("photo")
        if not uploaded_photo:
            return Response(
                {"detail": "Photo file is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        DeliveryProof.objects.update_or_create(
            stop=stop,
            defaults={"photo": uploaded_photo},
        )

        stop.status = RouteStop.Status.DELIVERED
        stop.delivered_at = timezone.now()
        stop.save(update_fields=["status", "delivered_at"])

        order = stop.order
        order.status = Order.Status.COMPLETED
        order.delivered_at = timezone.now()

        order_update_fields = ["status", "delivered_at"]
        if hasattr(order, "updated_at"):
            order_update_fields.append("updated_at")
        order.save(update_fields=order_update_fields)

        stop.route.refresh_completion_status(save=True)

        try:
            send_order_delivered_email_once.delay(order.id)
        except Exception:
            logger.error(
                "enqueue_delivered_email_failed",
                extra={"order_id": order.id},
                exc_info=True,
            )

        serializer = RouteStopSerializer(stop, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)


class MarkStopNoPickupView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsDriver]

    def post(self, request, stop_id, *args, **kwargs):
        driver = Driver.objects.filter(user=request.user).first()
        if not driver:
            return Response(
                {"detail": IsDriver.message},
                status=status.HTTP_403_FORBIDDEN,
            )

        stop = get_object_or_404(
            RouteStop.objects.select_related("route", "route__driver", "order"),
            pk=stop_id,
        )

        if not stop.route.driver or stop.route.driver_id != driver.id:
            return Response(
                {"detail": "You do not have permission to modify this stop."},
                status=status.HTTP_403_FORBIDDEN,
            )

        stop.status = RouteStop.Status.NO_PICKUP
        stop.delivered_at = timezone.now()
        stop.save(update_fields=["status", "delivered_at"])

        order = stop.order
        order.status = Order.Status.IN_PROGRESS

        order_update_fields = ["status"]
        if hasattr(order, "updated_at"):
            order_update_fields.append("updated_at")
        order.save(update_fields=order_update_fields)

        stop.route.refresh_completion_status(save=True)

        serializer = RouteStopSerializer(stop, context={"request": request})
        return Response(serializer.data, status=status.HTTP_200_OK)
