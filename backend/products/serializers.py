from rest_framework import serializers

from .models import Product, ProductImage


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ["id", "image_url", "alt_text", "sort_order"]


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = Product
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "price_cents",
            "main_image_url",
            "image_url",
            "category",
            "is_popular",
            "images",
        ]

    def get_image_url(self, obj):
        if not obj.image:
            return ""
        try:
            url = obj.image.url
        except ValueError:
            return ""
        request = self.context.get("request")
        if request:
            return request.build_absolute_uri(url)
        return url
