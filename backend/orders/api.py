from django.http import Http404
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import CustomerProfile
from .models import Order, Region
from .serializers import OrderCreateSerializer, OrderDetailSerializer, RegionSerializer


class OrderListView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        orders = Order.objects.filter(user=request.user).order_by("-created_at")[:50]
        serializer = OrderDetailSerializer(orders, many=True)
        return Response(serializer.data)

    def post(self, request):
        profile, _ = CustomerProfile.objects.get_or_create(user=request.user)

        payload = request.data.copy()

        full_name = payload.get("full_name")
        if not full_name or not str(full_name).strip():
            profile_full_name = " ".join(
                part for part in [profile.first_name, profile.last_name] if part
            ).strip()
            fallback_full_name = profile_full_name or (request.user.get_full_name() or "").strip()
            if not fallback_full_name:
                fallback_full_name = (request.user.email or "").strip()
            if fallback_full_name:
                payload["full_name"] = fallback_full_name

        email = payload.get("email")
        if (not email or not str(email).strip()) and request.user.email:
            payload["email"] = request.user.email

        phone = payload.get("phone")
        if (not phone or not str(phone).strip()) and profile.phone:
            payload["phone"] = profile.phone

        raw_allow_unverified = payload.get("allow_unverified")
        allow_unverified = bool(raw_allow_unverified) and request.user.is_staff

        serializer = OrderCreateSerializer(data=payload)
        serializer.is_valid(raise_exception=True)

        order_type = serializer.validated_data["order_type"]

        if not profile.email_verified_at and not allow_unverified:
            return Response(
                {"detail": "Please verify your email before placing an order."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if (
            order_type == Order.OrderType.DELIVERY
            and not profile.phone_verified_at
            and not allow_unverified
        ):
            return Response(
                {"detail": "Verify phone to place a delivery order."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = serializer.save(user=request.user)
        response_data = OrderDetailSerializer(order).data
        return Response(response_data, status=status.HTTP_201_CREATED)


class OrderDetailView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        order = get_object_or_404(Order, pk=pk)
        if order.user != request.user:
            raise Http404
        serializer = OrderDetailSerializer(order)
        return Response(serializer.data)


class RegionListView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, _request):
        regions = Region.objects.all().order_by("code")
        data = RegionSerializer(regions, many=True).data
        return Response(data)
