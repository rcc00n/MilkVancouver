from django.db import models


class Product(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    price_cents = models.PositiveIntegerField()
    image = models.ImageField(
        upload_to="products/",
        blank=True,
        null=True,
        help_text="Main product image (stored in S3 or local MEDIA_ROOT).",
    )
    main_image_url = models.URLField(blank=True)
    category = models.CharField(max_length=100, blank=True)
    is_popular = models.BooleanField(default=False)

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product, related_name="images", on_delete=models.CASCADE
    )
    image_url = models.URLField()
    alt_text = models.CharField(max_length=255, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]
