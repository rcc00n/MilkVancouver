from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Order
from .serializers import OrderCreateSerializer, OrderDetailSerializer


class OrderListView(APIView):
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
