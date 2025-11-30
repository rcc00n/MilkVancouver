import os

import stripe
from django.conf import settings
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response

from orders.models import Order, OrderItem
from products.models import Product

stripe.api_key = getattr(
    settings, "STRIPE_SECRET_KEY", os.environ.get("STRIPE_SECRET_KEY", "sk_test_placeholder")
)


def create_payment_intent(
    amount_cents: int, currency: str, receipt_email: str, metadata=None
):
    return stripe.PaymentIntent.create(
        amount=amount_cents,
        currency=currency,
        receipt_email=receipt_email,
        metadata=metadata or {},
    )


@api_view(["GET"])
def stripe_config(_request):
    """
    Expose the publishable key to the frontend at runtime so the payment form
    can initialize even if the static bundle was built without env baked in.
    """
    publishable_key = os.environ.get("STRIPE_PUBLISHABLE_KEY") or os.environ.get(
        "VITE_STRIPE_PUBLISHABLE_KEY"
    )

    if not publishable_key:
        return Response(
            {"detail": "Stripe publishable key is not configured."},
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )

    return Response(
        {
            "publishable_key": publishable_key,
            "livemode": publishable_key.startswith("pk_live_"),
        }
    )


@api_view(["POST"])
def create_checkout(request):
    data = request.data or {}
    raw_items = data.get("items") or []

    if not isinstance(raw_items, list) or not raw_items:
        return Response(
            {"detail": "Items are required."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    validated_items = []
    product_ids = []
    for index, item in enumerate(raw_items):
        if not isinstance(item, dict):
            return Response(
                {"detail": f"Item {index + 1} is invalid."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        product_id = item.get("product_id")
        quantity = item.get("quantity")

        try:
            product_id = int(product_id)
        except (TypeError, ValueError):
            return Response(
                {"detail": f"Invalid product_id for item {index + 1}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            quantity = int(quantity)
        except (TypeError, ValueError):
            return Response(
                {"detail": f"Invalid quantity for product {product_id}."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if quantity <= 0:
            return Response(
                {"detail": "Quantity must be at least 1."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        validated_items.append({"product_id": product_id, "quantity": quantity})
        product_ids.append(product_id)

    products = Product.objects.in_bulk(product_ids)
    missing_ids = [pid for pid in product_ids if pid not in products]
    if missing_ids:
        missing_ids = sorted(set(missing_ids))
        return Response(
            {"detail": f"Products not found: {', '.join(map(str, missing_ids))}."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    subtotal_cents = 0
    order_items_data = []
    for item in validated_items:
        product = products[item["product_id"]]
        quantity = item["quantity"]
        unit_price = product.price_cents
        line_total = unit_price * quantity
        subtotal_cents += line_total
        order_items_data.append(
            {
                "product": product,
                "product_name": product.name,
                "quantity": quantity,
                "unit_price_cents": unit_price,
                "total_cents": line_total,
            }
        )

    tax_cents = int(subtotal_cents * 0.05)
    total_cents = subtotal_cents + tax_cents

    order_type = data.get("order_type") or Order.OrderType.PICKUP
    if order_type not in Order.OrderType.values:
        return Response(
            {"detail": "Invalid order type."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    address = data.get("address") or {}
    if not isinstance(address, dict):
        address = {}

    delivery_notes = address.get("notes") or data.get("delivery_notes", "")

    order = Order.objects.create(
        full_name=data.get("full_name", ""),
        email=data.get("email", ""),
        phone=data.get("phone", ""),
        order_type=order_type,
        address_line1=address.get("line1", ""),
        address_line2=address.get("line2", ""),
        city=address.get("city", ""),
        postal_code=address.get("postal_code", ""),
        delivery_notes=delivery_notes,
        notes=data.get("notes", ""),
        pickup_location=data.get("pickup_location", ""),
        pickup_instructions=data.get("pickup_instructions", ""),
        subtotal_cents=subtotal_cents,
        tax_cents=tax_cents,
        total_cents=total_cents,
        status=Order.Status.PENDING,
    )

    order_items = [
        OrderItem(
            order=order,
            product=item_data["product"],
            product_name=item_data["product_name"],
            quantity=item_data["quantity"],
            unit_price_cents=item_data["unit_price_cents"],
            total_cents=item_data["total_cents"],
        )
        for item_data in order_items_data
    ]
    OrderItem.objects.bulk_create(order_items)

    try:
        intent = stripe.PaymentIntent.create(
            amount=total_cents,
            currency="cad",
            automatic_payment_methods={"enabled": True},
            receipt_email=order.email,
            metadata={"order_id": str(order.id)},
        )
    except Exception as exc:
        return Response(
            {"detail": "Unable to create payment intent.", "error": str(exc)},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    payment_intent_id = intent.get("id") if hasattr(intent, "get") else getattr(intent, "id", "")
    client_secret = (
        intent.get("client_secret")
        if hasattr(intent, "get")
        else getattr(intent, "client_secret", None)
    )

    order.stripe_payment_intent_id = payment_intent_id
    order.save(update_fields=["stripe_payment_intent_id"])

    return Response(
        {
            "client_secret": client_secret,
            "order_id": order.id,
            "amount": total_cents,
        },
        status=status.HTTP_201_CREATED,
    )
