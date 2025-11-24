from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("notifications", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="emailnotification",
            name="receipt_pdf",
            field=models.FileField(
                blank=True,
                help_text="Stored order receipt PDF",
                null=True,
                upload_to="receipts/",
            ),
        ),
    ]
