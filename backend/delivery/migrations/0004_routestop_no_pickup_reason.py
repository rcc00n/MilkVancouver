from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("delivery", "0003_deliveryroute_merged_at_deliveryroute_merged_into_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="routestop",
            name="no_pickup_reason",
            field=models.CharField(blank=True, max_length=255),
        ),
    ]
