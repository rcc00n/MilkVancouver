from typing import Dict, List

import stripe
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from orders.models import Order, OrderItem
from .serializers import CheckoutCreateSerializer
from .stripe_api import create_payment_intent


class CheckoutView(APIView):
    """
    Accepts cart data, creates an Order and OrderItems, then creates a Stripe PaymentIntent.
    """

    permission_classes = []  # AllowAny without default permission checks
    authentication_classes = []  # Allow unauthenticated checkout without CSRF

    def post(self, request, *args, **kwargs):
        serializer = CheckoutCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        products_map: Dict[int, object] = data["products_map"]
        items_data: List[Dict] = data["items"]

        subtotal_cents = 0
        order_items_payload: List[Dict] = []

        for item in items_data:
            product = products_map[item["product_id"]]
            quantity = item["quantity"]
            unit_price_cents = product.price_cents
            line_total = unit_price_cents * quantity
            subtotal_cents += line_total
            order_items_payload.append(
                {
                    "product": product,
                    "product_name": product.name,
                    "quantity": quantity,
                    "unit_price_cents": unit_price_cents,
                    "total_cents": line_total,
                }
            )

        tax_cents = int(round(subtotal_cents * 0.05))
        total_cents = subtotal_cents + tax_cents

        address = data.get("address") or {}
        order = Order.objects.create(
            full_name=data["full_name"],
            email=data["email"],
            phone=data["phone"],
            order_type=data["order_type"],
            status=Order.Status.PENDING,
            address_line1=address.get("line1", "") or "",
            address_line2=address.get("line2", "") or "",
            city=address.get("city", "") or "",
            postal_code=address.get("postal_code", "") or "",
            delivery_notes=address.get("notes", "") or "",
            pickup_location=data.get("pickup_location") or "",
            pickup_instructions=data.get("pickup_instructions") or "",
            notes=data.get("notes") or "",
            subtotal_cents=subtotal_cents,
            tax_cents=tax_cents,
            total_cents=total_cents,
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
            for item_data in order_items_payload
        ]
        OrderItem.objects.bulk_create(order_items)

        try:
            intent = create_payment_intent(
                amount_cents=total_cents,
                currency="cad",
                receipt_email=order.email,
                metadata={"order_id": str(order.id)},
            )
        except stripe.error.StripeError as exc:
            return Response(
                {"detail": "Unable to create payment intent.", "error": str(exc)},
                status=status.HTTP_502_BAD_GATEWAY,
            )
        except Exception as exc:  # pragma: no cover - safety net for unexpected errors
            return Response(
                {"detail": "Unable to create payment intent.", "error": str(exc)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        intent_id = intent.get("id", "") if hasattr(intent, "get") else getattr(intent, "id", "")
        client_secret = (
            intent.get("client_secret", "")
            if hasattr(intent, "get")
            else getattr(intent, "client_secret", "")
        )

        order.stripe_payment_intent_id = intent_id
        order.save(update_fields=["stripe_payment_intent_id"])

        return Response(
            {
                "client_secret": client_secret,
                "order_id": order.id,
                "amount": total_cents,
                "currency": "cad",
            },
            status=status.HTTP_201_CREATED,
        )
