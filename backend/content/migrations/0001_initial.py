from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="SiteImage",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("key", models.CharField(help_text="Key used by the frontend, e.g. home.hero", max_length=190, unique=True)),
                ("image", models.ImageField(blank=True, null=True, upload_to="site_images/")),
                ("alt_text", models.CharField(blank=True, max_length=255)),
                ("description", models.TextField(blank=True, help_text="Internal notes for marketing/admins.")),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
            ],
            options={"ordering": ["key"]},
        ),
    ]
