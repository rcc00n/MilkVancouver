from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.shortcuts import get_object_or_404

from .models import Order
from .serializers import OrderCreateSerializer, OrderDetailSerializer


class OrderListView(APIView):
    permission_classes = []  # AllowAny without default auth/permission checks
    authentication_classes = []  # Allow unauthenticated POSTs without CSRF

    def get(self, _request):
        orders = Order.objects.order_by("-created_at")[:20]
        serializer = OrderDetailSerializer(orders, many=True)
        return Response(serializer.data)

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order = serializer.save()
        response_data = OrderDetailSerializer(order).data
        return Response(response_data, status=status.HTTP_201_CREATED)


class OrderDetailView(APIView):
    permission_classes = []
    authentication_classes = []

    def get(self, _request, pk):
        order = get_object_or_404(Order, pk=pk)
        serializer = OrderDetailSerializer(order)
        return Response(serializer.data)
