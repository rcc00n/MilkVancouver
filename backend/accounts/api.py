import logging

from django.contrib.auth import authenticate, get_user_model, login
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import CustomerProfile, EmailVerificationToken
from accounts.serializers import (
    CustomerProfileSerializer,
    LoginSerializer,
    MeSerializer,
    RequestPhoneVerificationSerializer,
    RegisterSerializer,
    UserSerializer,
    VerifyPhoneSerializer,
)
from notifications.tasks import send_email_verification_email_task


User = get_user_model()
logger = logging.getLogger(__name__)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        login(request, user)
        profile, _created = CustomerProfile.objects.get_or_create(user=user)

        me_data = {"user": UserSerializer(user).data, "profile": CustomerProfileSerializer(profile).data}
        response = MeSerializer(me_data)
        return Response(response.data, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        email = serializer.validated_data["email"]
        password = serializer.validated_data["password"]

        user = authenticate(request, username=email, password=password)
        if not user:
            return Response({"detail": "Invalid email or password."}, status=status.HTTP_400_BAD_REQUEST)

        login(request, user)
        profile, _created = CustomerProfile.objects.get_or_create(user=user)

        me_data = {"user": UserSerializer(user).data, "profile": CustomerProfileSerializer(profile).data}
        response = MeSerializer(me_data)
        return Response(response.data, status=status.HTTP_200_OK)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        profile, _created = CustomerProfile.objects.get_or_create(user=user)

        me_data = {"user": UserSerializer(user).data, "profile": CustomerProfileSerializer(profile).data}
        response = MeSerializer(me_data)
        return Response(response.data)


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        profile, _created = CustomerProfile.objects.get_or_create(user=request.user)
        serializer = CustomerProfileSerializer(profile)
        return Response(serializer.data)

    def patch(self, request):
        profile, _created = CustomerProfile.objects.get_or_create(user=request.user)
        serializer = CustomerProfileSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data)


class RequestEmailVerificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        token = EmailVerificationToken.objects.create_for_user(request.user)
        send_email_verification_email_task.delay(request.user.id, token.token)
        return Response({"detail": "Verification email sent."}, status=status.HTTP_200_OK)


class VerifyEmailView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        token_value = request.query_params.get("token")
        if not token_value:
            logger.warning("email_verify_missing_token")
            return Response({"detail": "Token is required."}, status=status.HTTP_400_BAD_REQUEST)

        token = EmailVerificationToken.objects.filter(token=token_value).select_related("user").first()
        if not token:
            logger.warning("email_verify_invalid_token", extra={"token_value": token_value})
            return Response({"detail": "Invalid token."}, status=status.HTTP_400_BAD_REQUEST)

        if token.is_used():
            logger.info(
                "email_verify_token_used",
                extra={"token_id": token.id, "user_id": token.user_id},
            )
            return Response({"detail": "Token has already been used."}, status=status.HTTP_400_BAD_REQUEST)

        if token.is_expired():
            logger.info(
                "email_verify_token_expired",
                extra={"token_id": token.id, "user_id": token.user_id},
            )
            return Response({"detail": "Token has expired."}, status=status.HTTP_400_BAD_REQUEST)

        token.mark_used()

        profile, _created = CustomerProfile.objects.get_or_create(user=token.user)
        profile.email_verified_at = timezone.now()
        profile.save(update_fields=["email_verified_at", "updated_at"])

        # Invalidate any other active tokens for this user.
        EmailVerificationToken.objects.filter(
            user=token.user,
            used_at__isnull=True,
            expires_at__gt=timezone.now(),
        ).exclude(id=token.id).update(used_at=timezone.now())

        logger.info(
            "email_verification_success",
            extra={"token_id": token.id, "user_id": token.user_id},
        )
        return Response({"detail": "Email verified successfully."}, status=status.HTTP_200_OK)


class RequestPhoneVerificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = RequestPhoneVerificationSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Verification code sent via SMS."}, status=status.HTTP_201_CREATED)


class VerifyPhoneView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = VerifyPhoneSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Phone number verified successfully."}, status=status.HTTP_200_OK)
