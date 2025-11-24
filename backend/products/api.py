from rest_framework.response import Response
from rest_framework.views import APIView


class ProductListView(APIView):
    def get(self, request):  # pragma: no cover - placeholder
        return Response([])
