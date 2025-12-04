from rest_framework import serializers

from .models import Category, Product, ProductImage


class ProductImageSerializer(serializers.ModelSerializer):
    image_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = ["id", "image_url", "alt_text", "sort_order"]

    def get_image_url(self, obj):
        if obj.image:
            try:
                url = obj.image.url
                request = self.context.get("request")
                if request:
                    return request.build_absolute_uri(url)
                return url
            except Exception:
                pass
        return obj.image_url or ""


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ["id", "name", "slug", "description"]


class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    image_url = serializers.SerializerMethodField()
    category = CategorySerializer(read_only=True)
    category_name = serializers.CharField(source="category.name", read_only=True)

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
            "category_name",
            "is_popular",
            "is_active",
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
