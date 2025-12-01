import pytest

from orders.models import Order, Region
from orders.serializers import OrderDetailSerializer

pytestmark = pytest.mark.django_db


def test_order_region_serialization():
    region = Region.objects.filter(code="north").first() or Region.objects.first()
    order = Order.objects.create(
        full_name="Test User",
        email="user@example.com",
        phone="555-0000",
        order_type=Order.OrderType.DELIVERY,
        status=Order.Status.PENDING,
        subtotal_cents=1000,
        tax_cents=50,
        total_cents=1050,
        region=region,
    )

    data = OrderDetailSerializer(order).data
    assert data["region"] == region.code
    assert data["region_name"] == region.name


def test_order_region_none_serializes():
    order = Order.objects.create(
        full_name="No Region",
        email="noregion@example.com",
        phone="555-1111",
        order_type=Order.OrderType.PICKUP,
        status=Order.Status.PENDING,
        subtotal_cents=500,
        tax_cents=0,
        total_cents=500,
        region=None,
    )

    data = OrderDetailSerializer(order).data
    assert data.get("region") is None
    assert data.get("region_name") is None
