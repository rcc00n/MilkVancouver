# Generated manually to initialize payments tables.
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ("orders", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="Payment",
            fields=[
                (
                    "id",
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name="ID",
                    ),
                ),
                ("provider", models.CharField(choices=[("stripe", "Stripe")], default="stripe", max_length=20)),
                ("kind", models.CharField(choices=[("charge", "Charge"), ("refund", "Refund")], default="charge", max_length=20)),
                ("amount_cents", models.PositiveIntegerField()),
                ("currency", models.CharField(default="cad", max_length=10)),
                ("status", models.CharField(choices=[("requires_payment_method", "Requires Payment Method"), ("requires_confirmation", "Requires Confirmation"), ("requires_action", "Requires Action"), ("processing", "Processing"), ("succeeded", "Succeeded"), ("canceled", "Canceled")], default="requires_payment_method", max_length=50)),
                ("stripe_payment_intent_id", models.CharField(blank=True, max_length=255)),
                ("stripe_charge_id", models.CharField(blank=True, max_length=255)),
                ("raw_payload", models.JSONField(blank=True, null=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "order",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="payments",
                        to="orders.order",
                    ),
                ),
            ],
            options={
                "ordering": ["-created_at"],
            },
        ),
        migrations.AddIndex(
            model_name="payment",
            index=models.Index(fields=["order", "created_at"], name="payments_pay_order_i_7f2e26_idx"),
        ),
        migrations.AddIndex(
            model_name="payment",
            index=models.Index(fields=["stripe_payment_intent_id"], name="payments_pay_stripe__2d095f_idx"),
        ),
    ]
