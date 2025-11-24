from django.db import models
from django.utils import timezone


class BlogPost(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    author = models.CharField(max_length=255, blank=True)
    excerpt = models.TextField(blank=True)
    content = models.TextField()
    cover_image_url = models.URLField(blank=True)
    published_at = models.DateTimeField(default=timezone.now, blank=True)
    is_published = models.BooleanField(default=False)

    class Meta:
        ordering = ["-published_at", "-id"]

    def __str__(self):
        return self.title
