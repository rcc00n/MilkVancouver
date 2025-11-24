from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "id",
            "order",
            "provider",
            "kind",
            "status",
            "amount_cents",
            "currency",
            "stripe_payment_intent_id",
            "stripe_charge_id",
            "created_at",
        ]
        read_only_fields = fields
