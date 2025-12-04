from django.db import models


class Category(models.Model):
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


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
    category = models.ForeignKey(
        Category,
        null=True,
        blank=True,
        related_name="products",
        on_delete=models.SET_NULL,
    )
    is_popular = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True, db_index=True)

    def __str__(self):
        return self.name


class ProductImage(models.Model):
    product = models.ForeignKey(
        Product, related_name="images", on_delete=models.CASCADE
    )
    image = models.ImageField(
        upload_to="products/gallery/",
        null=True,
        blank=True,
        help_text="Gallery image stored in S3 or media.",
    )
    image_url = models.URLField(blank=True, help_text="Optional external image URL (legacy).")
    alt_text = models.CharField(max_length=255, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["sort_order", "id"]
