from typing import Dict, List

import stripe
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import CustomerProfile
from orders.models import Order, OrderItem
from .serializers import CheckoutCreateSerializer
from .stripe_api import create_payment_intent


class CheckoutView(APIView):
    """
    Accepts cart data, creates an Order and OrderItems, then creates a Stripe PaymentIntent.
    """

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, *args, **kwargs):
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

        serializer = CheckoutCreateSerializer(data=payload)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        products_map: Dict[int, object] = data["products_map"]
        items_data: List[Dict] = data["items"]
        region = data.get("region")

        raw_allow_unverified = request.data.get("allow_unverified")
        allow_unverified = bool(raw_allow_unverified) and request.user.is_staff

        order_type = data["order_type"]

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
        email_source = request.user.email or data["email"]
        order_email = email_source.strip() if email_source else ""
        order = Order.objects.create(
            user=request.user,
            full_name=data["full_name"],
            email=order_email,
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
            region=region,
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

        if region and (profile.region_id != region.id or profile.region_code != region.code):
            profile.region = region
            profile.region_code = region.code
            profile.save(update_fields=["region", "region_code", "updated_at"])

        return Response(
            {
                "client_secret": client_secret,
                "order_id": order.id,
                "amount": total_cents,
                "currency": "cad",
            },
            status=status.HTTP_201_CREATED,
        )
