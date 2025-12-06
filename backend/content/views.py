from django.utils.decorators import method_decorator
from django.views.decorators.cache import never_cache
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SiteImage
from .serializers import SiteImageSerializer


class SiteImageListView(APIView):
    permission_classes = [AllowAny]

    @method_decorator(never_cache)
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
        return Response(payload)


class SiteImageDetailView(APIView):
    permission_classes = [AllowAny]

    @method_decorator(never_cache)
    def get(self, _request, key: str):
        try:
            image = SiteImage.objects.get(key=key)
        except SiteImage.DoesNotExist:
            return Response({"detail": "Not found."}, status=404)

        data = SiteImageSerializer(image).data
        return Response(
            {
                "key": data["key"],
                "url": data["url"],
                "alt": data["alt_text"],
                "description": data["description"],
            }
        )
