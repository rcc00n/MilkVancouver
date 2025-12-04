import logging
import random
from datetime import timedelta

from django.conf import settings
from django.contrib.auth import get_user_model, password_validation
from django.contrib.auth.hashers import check_password, make_password
from django.utils import timezone
from rest_framework import serializers

from accounts.models import CustomerProfile, PhoneVerification
from orders.models import Region
from accounts.tasks import send_phone_verification_sms


User = get_user_model()
logger = logging.getLogger(__name__)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "email", "first_name", "last_name"]
        read_only_fields = ["id", "username", "email"]


class CustomerProfileSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source="region.name", read_only=True)

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
            "region_name",
            "email_verified_at",
            "phone_verified_at",
        ]
        read_only_fields = ["email_verified_at", "phone_verified_at", "region_name"]

    def update(self, instance, validated_data):
        user = instance.user
        first_name = validated_data.get("first_name")
        last_name = validated_data.get("last_name")
        region_code = validated_data.get("region_code", None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        if region_code is not None:
            region_value = (region_code or "").strip()
            region = (
                Region.objects.filter(code__iexact=region_value).first()
                if region_value
                else None
            )
            instance.region = region

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


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = self.context["request"].user
        current_password = attrs.get("current_password")
        new_password = attrs.get("new_password")
        new_password_confirm = attrs.get("new_password_confirm")

        if not user.check_password(current_password):
            raise serializers.ValidationError({"current_password": "Current password is incorrect."})

        if new_password != new_password_confirm:
            raise serializers.ValidationError({"new_password_confirm": "Passwords do not match."})

        password_validation.validate_password(new_password, user=user)
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        new_password = self.validated_data["new_password"]
        user.set_password(new_password)
        user.save(update_fields=["password"])
        return user


class MeSerializer(serializers.Serializer):
    user = UserSerializer()
    profile = CustomerProfileSerializer()


class RequestPhoneVerificationSerializer(serializers.Serializer):
    phone_number = serializers.CharField(max_length=32, required=False, allow_blank=True)

    def validate(self, attrs):
        request = self.context["request"]
        user = request.user
        phone_number = attrs.get("phone_number", "").strip()

        if not phone_number:
            profile, _ = CustomerProfile.objects.get_or_create(user=user)
            phone_number = profile.phone.strip()

        if not phone_number:
            raise serializers.ValidationError("Phone number is required.")

        today = timezone.now().date()
        max_per_day = getattr(settings, "PHONE_VERIFICATION_MAX_PER_DAY", 3)
        daily_count = PhoneVerification.objects.filter(user=user, created_at__date=today).count()
        if daily_count >= max_per_day:
            logger.info(
                "phone_verification_rate_limited",
                extra={
                    "user_id": user.id,
                    "phone_number": phone_number,
                    "daily_count": daily_count,
                    "max_per_day": max_per_day,
                },
            )
            raise serializers.ValidationError("You have reached the daily phone verification limit.")

        attrs["phone_number"] = phone_number
        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        phone_number = validated_data["phone_number"]

        code = f"{random.randint(0, 999999):06d}"
        code_hash = make_password(code)
        expires_at = timezone.now() + timedelta(
            minutes=getattr(settings, "PHONE_VERIFICATION_TTL_MINUTES", 10)
        )

        verification = PhoneVerification.objects.create(
            user=user,
            phone_number=phone_number,
            code_hash=code_hash,
            expires_at=expires_at,
        )

        send_phone_verification_sms.delay(verification.id, code)

        return verification


class VerifyPhoneSerializer(serializers.Serializer):
    code = serializers.CharField()

    def validate_code(self, value):
        code = value.strip()
        if len(code) != 6 or not code.isdigit():
            raise serializers.ValidationError("Code must be a 6-digit number.")
        return code

    def validate(self, attrs):
        user = self.context["request"].user
        now = timezone.now()
        verification = (
            PhoneVerification.objects.filter(user=user, expires_at__gt=now)
            .order_by("-created_at")
            .first()
        )

        if not verification:
            logger.info(
                "phone_verification_missing",
                extra={"user_id": user.id},
            )
            raise serializers.ValidationError("No active verification code found. Please request a new one.")

        if verification.is_locked:
            logger.info(
                "phone_verification_locked",
                extra={"user_id": user.id, "verification_id": verification.id},
            )
            raise serializers.ValidationError("Too many incorrect attempts. Please request a new code.")

        attrs["verification"] = verification
        return attrs

    def create(self, validated_data):
        user = self.context["request"].user
        code = validated_data["code"]
        verification = validated_data["verification"]

        if not check_password(code, verification.code_hash):
            verification.attempts += 1
            verification.save(update_fields=["attempts"])
            max_attempts = getattr(settings, "PHONE_VERIFICATION_MAX_ATTEMPTS", 5)
            remaining = max(max_attempts - verification.attempts, 0)
            message = "Incorrect code."
            if remaining > 0:
                message = f"{message} {remaining} attempt(s) remaining."
            logger.info(
                "phone_verification_incorrect_code",
                extra={
                    "user_id": user.id,
                    "verification_id": verification.id,
                    "attempts": verification.attempts,
                },
            )
            raise serializers.ValidationError(message)

        now = timezone.now()
        verification.verified_at = now
        verification.attempts += 1
        verification.save(update_fields=["verified_at", "attempts"])

        PhoneVerification.objects.filter(
            user=user,
            expires_at__gt=now,
            verified_at__isnull=True,
        ).exclude(id=verification.id).update(expires_at=now)

        profile, _ = CustomerProfile.objects.get_or_create(user=user)
        profile.phone = verification.phone_number
        profile.phone_verified_at = now
        profile.save(update_fields=["phone", "phone_verified_at", "updated_at"])

        logger.info(
            "phone_verification_success",
            extra={"user_id": user.id, "verification_id": verification.id},
        )
        return verification
