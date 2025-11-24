from rest_framework.response import Response
from rest_framework.views import APIView


class StripeWebhookView(APIView):
    def post(self, request):  # pragma: no cover - placeholder
        # Process webhook payload here.
        return Response({"received": True})
