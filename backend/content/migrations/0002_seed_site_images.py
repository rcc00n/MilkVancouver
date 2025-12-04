from django.db import migrations


IMAGE_KEYS = [
    "home.hero.main",
    "home.flavor.berry_blast",
    "home.flavor.honey_vanilla",
    "home.flavor.chocolate_swirl",
    "home.flavor.tropical_sunrise",
    "home.story.image_1",
    "home.story.image_2",
    "home.story.image_3",
    "home.community_1",
    "home.community_2",
    "home.community_3",
    "home.community_4",
    "home.community_5",
    "home.community_6",
    "legacyHome.category.freshMilk",
    "legacyHome.category.yogurt",
    "legacyHome.category.cheeseButter",
    "legacyHome.category.coffeeBar",
    "legacyHome.milkBox.barista",
    "legacyHome.milkBox.family",
    "legacyHome.milkBox.cheese",
    "gallery.01.frontCounter",
    "gallery.02.bottling",
    "gallery.03.lattemilk",
    "gallery.04.yogurtBar",
    "gallery.05.cheeseBoard",
    "gallery.06.deliveryCrates",
    "gallery.07.pasture",
    "gallery.08.morningHerd",
    "gallery.09.hayfield",
    "gallery.10.routeWall",
    "about.hero.local",
    "about.story.bottling",
]


def create_placeholders(apps, _schema_editor):
    SiteImage = apps.get_model("content", "SiteImage")
    for key in IMAGE_KEYS:
        SiteImage.objects.get_or_create(
            key=key,
            defaults={
                "alt_text": key.replace(".", " ").replace("_", " ").title(),
                "description": "Placeholder seeded from inventory; upload an image in admin.",
            },
        )


def delete_placeholders(apps, _schema_editor):
    SiteImage = apps.get_model("content", "SiteImage")
    SiteImage.objects.filter(key__in=IMAGE_KEYS).delete()


class Migration(migrations.Migration):
    dependencies = [
        ("content", "0001_initial"),
    ]

    operations = [
        migrations.RunPython(create_placeholders, reverse_code=delete_placeholders),
    ]
