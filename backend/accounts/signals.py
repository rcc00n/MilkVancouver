from django.contrib.auth import get_user_model
from django.db.models.signals import post_save
from django.dispatch import receiver

from accounts.models import CustomerProfile


User = get_user_model()


@receiver(post_save, sender=User)
def create_customer_profile(sender, instance, created, **kwargs):
    if not created:
        return

    CustomerProfile.objects.get_or_create(
        user=instance,
        defaults={
            "first_name": getattr(instance, "first_name", "") or "",
            "last_name": getattr(instance, "last_name", "") or "",
        },
    )
