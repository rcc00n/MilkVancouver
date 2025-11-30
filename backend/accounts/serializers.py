from django.contrib.auth import get_user_model
from rest_framework import serializers

from accounts.models import CustomerProfile


User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]
        read_only_fields = ["id", "username", "email"]


class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = [
            "first_name",
            "last_name",
            "phone",
            "address_line1",
            "address_line2",
            "city",
            "postal_code",
            "region_code",
            "email_verified_at",
            "phone_verified_at",
        ]
        read_only_fields = ["email_verified_at", "phone_verified_at"]

    def update(self, instance, validated_data):
        user = instance.user
        first_name = validated_data.get("first_name")
        last_name = validated_data.get("last_name")

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        user_update_fields = []
        if first_name is not None and first_name != user.first_name:
            user.first_name = first_name
            user_update_fields.append("first_name")
        if last_name is not None and last_name != user.last_name:
            user.last_name = last_name
            user_update_fields.append("last_name")

        if user_update_fields:
            user.save(update_fields=user_update_fields)

        return instance


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(max_length=150, allow_blank=True, required=False)
    last_name = serializers.CharField(max_length=150, allow_blank=True, required=False)
    phone = serializers.CharField(max_length=50, allow_blank=True, required=False)
    address_line1 = serializers.CharField(max_length=255, allow_blank=True, required=False)
    address_line2 = serializers.CharField(max_length=255, allow_blank=True, required=False)
    city = serializers.CharField(max_length=100, allow_blank=True, required=False)
    postal_code = serializers.CharField(max_length=20, allow_blank=True, required=False)
    region_code = serializers.CharField(max_length=32, allow_blank=True, required=False)

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with that email already exists.")
        return value

    def create(self, validated_data):
        profile_fields = {
            "first_name",
            "last_name",
            "phone",
            "address_line1",
            "address_line2",
            "city",
            "postal_code",
            "region_code",
        }
        profile_data = {field: validated_data.get(field, "") for field in profile_fields}

        email = validated_data["email"]
        password = validated_data["password"]
        first_name = validated_data.get("first_name", "") or ""
        last_name = validated_data.get("last_name", "") or ""

        user = User.objects.create_user(
            username=email,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )

        profile, _created = CustomerProfile.objects.get_or_create(user=user)
        for field, value in profile_data.items():
            setattr(profile, field, value or "")
        profile.save()

        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=1)


class MeSerializer(serializers.Serializer):
    user = UserSerializer()
    profile = CustomerProfileSerializer()
