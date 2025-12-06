from django.db import migrations


LOGO_KEY = "brand.logo"


def ensure_logo_exists(apps, _schema_editor):
    SiteImage = apps.get_model("content", "SiteImage")
    SiteImage.objects.get_or_create(
        key=LOGO_KEY,
        defaults={
            "alt_text": "Brand logo",
            "description": "Topbar/primary navigation logo. Replace via admin to update the site header.",
        },
    )


def noop_reverse(apps, _schema_editor):
    # Keep the logo row if it was created; no-op on reverse.
    return


class Migration(migrations.Migration):
    dependencies = [
        ("content", "0003_add_brand_logo"),
    ]

    operations = [
        migrations.RunPython(ensure_logo_exists, reverse_code=noop_reverse),
    ]
