from django.db import models


class SiteImage(models.Model):
    key = models.CharField(max_length=190, unique=True, help_text="Key used by the frontend, e.g. home.hero")
    image = models.ImageField(upload_to="site_images/", null=True, blank=True)
    alt_text = models.CharField(max_length=255, blank=True)
    description = models.TextField(blank=True, help_text="Internal notes for marketing/admins.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["key"]

    def __str__(self) -> str:
        return self.key
