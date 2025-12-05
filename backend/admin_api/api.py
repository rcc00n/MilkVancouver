from typing import Any, Dict, List, Optional

from django.contrib.auth import get_user_model
from django.db import transaction
from django.db.models import Count, F, Max, OuterRef, Prefetch, Q, Subquery, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers
from rest_framework.permissions import IsAdminUser
from rest_framework.request import Request
from rest_framework.response import Response
from rest_framework.views import APIView

from delivery.models import DeliveryRoute, RouteStop
from delivery.serializers import DeliveryRouteSerializer
from orders.models import Order, OrderItem

User = get_user_model()


class AdminPermission(IsAdminUser):
    """
    Thin wrapper around IsAdminUser for future customizations.
    """

    pass


class AdminDashboardView(APIView):
    permission_classes = [AdminPermission]

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        paid_orders = Order.objects.filter(status=Order.Status.PAID)
        total_sales_agg = paid_orders.aggregate(total_sales_cents=Sum("total_cents"))
        total_sales_cents = total_sales_agg.get("total_sales_cents") or 0

        dashboard_statuses = [
            Order.Status.PAID,
            Order.Status.COMPLETED,
            Order.Status.CANCELLED,
        ]
        orders_by_status_qs = (
            Order.objects.filter(status__in=dashboard_statuses)
            .values("status")
            .annotate(count=Count("id"))
        )
        orders_by_status: Dict[str, int] = {
            row["status"]: row["count"] for row in orders_by_status_qs
        }

        top_regions_qs = (
            Order.objects.filter(
                status__in=dashboard_statuses, region__isnull=False
            )
            .values(code=F("region__code"), name=F("region__name"))
            .annotate(order_count=Count("id"))
            .order_by("-order_count", "code")[:5]
        )
        top_regions: List[Dict[str, Any]] = list(top_regions_qs)

        top_products_qs = (
            OrderItem.objects.filter(order__status=Order.Status.PAID)
            .values("product_id", "product_name")
            .annotate(
                quantity_sold=Sum("quantity"),
                total_revenue_cents=Sum("total_cents"),
            )
            .order_by("-quantity_sold", "product_id")[:5]
        )
        top_products: List[Dict[str, Any]] = list(top_products_qs)

        return Response(
            {
                "total_sales_cents": total_sales_cents,
                "total_sales": total_sales_cents / 100.0,
                "orders_by_status": orders_by_status,
                "top_regions": top_regions,
                "top_products": top_products,
            }
        )


class AdminClientsView(APIView):
    permission_classes = [AdminPermission]

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        paid_statuses = [Order.Status.PAID, Order.Status.COMPLETED]

        region_qs = (
            Order.objects.filter(
                user_id=OuterRef("pk"),
                region__isnull=False,
                status__in=paid_statuses,
            )
            .values("region__code", "region__name")
            .annotate(c=Count("id"))
            .order_by("-c", "region__code")
        )

        clients_qs = (
            User.objects.annotate(
                total_orders=Count(
                    "orders",
                    filter=Q(orders__status__in=paid_statuses),
                    distinct=True,
                ),
                total_spent_cents=Sum(
                    "orders__total_cents",
                    filter=Q(orders__status__in=paid_statuses),
                ),
                most_freq_region_code=Subquery(region_qs.values("region__code")[:1]),
                most_freq_region_name=Subquery(region_qs.values("region__name")[:1]),
            )
            .filter(total_orders__gt=0)
            .order_by("id")
        )

        clients: List[Dict[str, Any]] = []
        for user in clients_qs:
            total_spent_cents = user.total_spent_cents or 0
            region_code: Optional[str] = getattr(user, "most_freq_region_code", None)
            region_name: Optional[str] = getattr(user, "most_freq_region_name", None)
            most_frequent_region = (
                {"code": region_code, "name": region_name}
                if region_code and region_name
                else None
            )
            clients.append(
                {
                    "user_id": user.id,
                    "email": getattr(user, "email", "") or "",
                    "total_orders": user.total_orders or 0,
                    "total_spent_cents": total_spent_cents,
                    "total_spent": total_spent_cents / 100.0,
                    "most_frequent_region": most_frequent_region,
                }
            )

        return Response(clients)


class AdminRouteListView(APIView):
    permission_classes = [AdminPermission]

    def get(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        queryset = (
            DeliveryRoute.objects.select_related(
                "region", "driver", "driver__user", "driver__preferred_region"
            )
            .prefetch_related(
                Prefetch(
                    "stops",
                    queryset=RouteStop.objects.select_related("order").order_by(
                        "sequence", "id"
                    ),
                )
            )
            .order_by("-date", "region__code", "id")
        )

        include_merged = request.query_params.get("include_merged", "").lower() in (
            "1",
            "true",
            "yes",
        )
        if not include_merged:
            queryset = queryset.filter(merged_into__isnull=True)

        date_param = request.query_params.get("date")
        if date_param:
            queryset = queryset.filter(date=date_param)

        region_param = request.query_params.get("region")
        if region_param:
            queryset = queryset.filter(region__code__iexact=region_param)

        driver_id_param = request.query_params.get("driver_id")
        if driver_id_param:
            try:
                driver_id = int(driver_id_param)
            except (TypeError, ValueError):
                return Response(
                    {"detail": "driver_id must be an integer."}, status=400
                )
            queryset = queryset.filter(driver_id=driver_id)

        serializer = DeliveryRouteSerializer(
            queryset, many=True, context={"request": request}
        )
        return Response(serializer.data)


class AdminRouteDetailView(APIView):
    permission_classes = [AdminPermission]

    def get(self, request: Request, pk: int, *args: Any, **kwargs: Any) -> Response:
        route = get_object_or_404(
            DeliveryRoute.objects.select_related(
                "region", "driver", "driver__user", "driver__preferred_region"
            )
            .prefetch_related(
                Prefetch(
                    "stops",
                    queryset=RouteStop.objects.select_related("order").order_by(
                        "sequence", "id"
                    ),
                )
            ),
            pk=pk,
        )
        serializer = DeliveryRouteSerializer(route, context={"request": request})
        return Response(serializer.data)


class RouteReorderSerializer(serializers.Serializer):
    stop_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        allow_empty=False,
    )


class AdminRouteReorderView(APIView):
    permission_classes = [AdminPermission]

    def post(self, request: Request, pk: int, *args: Any, **kwargs: Any) -> Response:
        route = get_object_or_404(
            DeliveryRoute.objects.prefetch_related(
                Prefetch("stops", queryset=RouteStop.objects.order_by("sequence", "id"))
            ),
            pk=pk,
        )
        serializer = RouteReorderSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        stop_ids: List[int] = serializer.validated_data["stop_ids"]
        existing_ids = {stop.id for stop in route.stops.all()}
        if set(stop_ids) != existing_ids:
            return Response(
                {
                    "detail": "stop_ids must match exactly the set of stops for this route."
                },
                status=400,
            )

        max_sequence = route.stops.aggregate(max_seq=Max("sequence")).get("max_seq") or 0
        temp_offset = max_sequence + 1000

        with transaction.atomic():
            for index, stop_id in enumerate(stop_ids, start=1):
                RouteStop.objects.filter(pk=stop_id, route=route).update(
                    sequence=temp_offset + index
                )

            for index, stop_id in enumerate(stop_ids, start=1):
                RouteStop.objects.filter(pk=stop_id, route=route).update(
                    sequence=index
                )

        refreshed_route = (
            DeliveryRoute.objects.select_related(
                "region", "driver", "driver__user", "driver__preferred_region"
            )
            .prefetch_related(
                Prefetch(
                    "stops",
                    queryset=RouteStop.objects.select_related("order").order_by(
                        "sequence", "id"
                    ),
                )
            )
            .get(pk=pk)
        )
        response_serializer = DeliveryRouteSerializer(
            refreshed_route, context={"request": request}
        )
        return Response(response_serializer.data)


class RouteMergeSerializer(serializers.Serializer):
    source_route_id = serializers.IntegerField(min_value=1)
    target_route_id = serializers.IntegerField(min_value=1)


class AdminRouteMergeView(APIView):
    permission_classes = [AdminPermission]

    def post(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        serializer = RouteMergeSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        source_id = serializer.validated_data["source_route_id"]
        target_id = serializer.validated_data["target_route_id"]

        if source_id == target_id:
            return Response(
                {"detail": "source_route_id and target_route_id must be different."},
                status=400,
            )

        routes_qs = (
            DeliveryRoute.objects.select_for_update()
            .select_related("region", "driver", "driver__user", "driver__preferred_region")
            .prefetch_related(
                Prefetch(
                    "stops",
                    queryset=RouteStop.objects.select_related("order").order_by(
                        "sequence", "id"
                    ),
                )
            )
            .filter(id__in=[source_id, target_id], merged_into__isnull=True)
        )
        routes = list(routes_qs)

        if len(routes) != 2:
            return Response(
                {"detail": "One or both routes not found or already merged."}, status=404
            )

        source = next(route for route in routes if route.id == source_id)
        target = next(route for route in routes if route.id == target_id)

        if source.date != target.date:
            return Response(
                {"detail": "Routes must be on the same date to merge."},
                status=400,
            )

        with transaction.atomic():
            stops = list(source.stops.all().order_by("sequence", "id"))
            starting_sequence = (
                target.stops.aggregate(max_seq=Max("sequence")).get("max_seq") or 0
            )

            for index, stop in enumerate(stops, start=1):
                stop.route_id = target.id
                stop.sequence = starting_sequence + index

            if stops:
                RouteStop.objects.bulk_update(stops, ["route", "sequence"])

            DeliveryRoute.objects.filter(pk=source.id).update(
                merged_into=target,
                merged_at=timezone.now(),
                driver=None,
                is_completed=True,
            )

            refreshed_target = (
                DeliveryRoute.objects.select_related(
                    "region", "driver", "driver__user", "driver__preferred_region"
                )
                .prefetch_related(
                    Prefetch(
                        "stops",
                        queryset=RouteStop.objects.select_related("order").order_by(
                            "sequence", "id"
                        ),
                    )
                )
                .get(pk=target.id)
            )
            refreshed_target.refresh_completion_status(save=True)

        response_serializer = DeliveryRouteSerializer(
            refreshed_target, context={"request": request}
        )
        return Response(
            {
                "merged_from_route_id": source.id,
                "moved_stops": len(stops),
                "target_route": response_serializer.data,
            }
        )
