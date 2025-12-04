from rest_framework import serializers

from .models import SiteImage


class SiteImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = SiteImage
        fields = ("key", "url", "alt_text", "description")

    def get_url(self, obj: SiteImage):
        if obj.image:
            try:
                return obj.image.url
            except ValueError:
                return None
        return None
