import os

from rest_framework.response import Response
from rest_framework.views import APIView

import stripe

stripe.api_key = os.environ.get("STRIPE_SECRET_KEY", "sk_test_placeholder")


class CreatePaymentIntentView(APIView):
    def post(self, request):  # pragma: no cover - placeholder
        amount = request.data.get("amount", 0)
        currency = request.data.get("currency", "usd")
        # In real usage you'd validate and calculate amount server-side.
        try:
            intent = stripe.PaymentIntent.create(amount=amount or 100, currency=currency)
            client_secret = intent.get("client_secret")
            live_mode = intent.get("livemode", False)
        except Exception:
            client_secret = "mock_client_secret"
            live_mode = False
        return Response({"client_secret": client_secret, "livemode": live_mode})
