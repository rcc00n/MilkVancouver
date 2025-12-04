from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SiteImage
from .serializers import SiteImageSerializer


CACHE_TIMEOUT = 60 * 10  # 10 minutes


class SiteImageListView(APIView):
    permission_classes = [AllowAny]

    @method_decorator(cache_page(CACHE_TIMEOUT))
    def get(self, _request):
        images = SiteImage.objects.all()
        serialized = SiteImageSerializer(images, many=True).data
        payload = {
            item["key"]: {
                "url": item["url"],
                "alt": item["alt_text"],
                "description": item["description"],
            }
            for item in serialized
        }
        response = Response(payload)
        response["Cache-Control"] = f"public, max-age={CACHE_TIMEOUT}"
        return response


class SiteImageDetailView(APIView):
    permission_classes = [AllowAny]

    @method_decorator(cache_page(CACHE_TIMEOUT))
    def get(self, _request, key: str):
        try:
            image = SiteImage.objects.get(key=key)
        except SiteImage.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)

        data = SiteImageSerializer(image).data
        response = Response(
            {
                "key": data["key"],
                "url": data["url"],
                "alt": data["alt_text"],
                "description": data["description"],
            }
        )
        response["Cache-Control"] = f"public, max-age={CACHE_TIMEOUT}"
        return response
