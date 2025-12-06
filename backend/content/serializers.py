from rest_framework import serializers

from .models import SiteImage


class SiteImageSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

    class Meta:
        model = SiteImage
        fields = ("key", "url", "alt_text", "description")

    def get_url(self, obj: SiteImage):
        if not obj.image:
            return None

        try:
            url = obj.image.url
        except ValueError:
            return None

        # Append a version so browsers/S3/CDN caches fetch the latest upload.
        version = int(obj.updated_at.timestamp()) if obj.updated_at else None
        if version:
            separator = "&" if "?" in url else "?"
            return f"{url}{separator}v={version}"
        return url
