from django.db import migrations


LOGO_KEY = "brand.logo"


def add_logo_placeholder(apps, _schema_editor):
    SiteImage = apps.get_model("content", "SiteImage")
    SiteImage.objects.get_or_create(
        key=LOGO_KEY,
        defaults={
            "alt_text": "Brand logo",
            "description": "Topbar/primary navigation logo. Replace via admin to update the site header.",
        },
    )


def remove_logo_placeholder(apps, _schema_editor):
    SiteImage = apps.get_model("content", "SiteImage")
    SiteImage.objects.filter(key=LOGO_KEY).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("content", "0002_seed_site_images"),
    ]

    operations = [
        migrations.RunPython(add_logo_placeholder, reverse_code=remove_logo_placeholder),
    ]
