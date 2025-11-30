from django.contrib.auth import authenticate, get_user_model, login
from rest_framework import permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.models import CustomerProfile
from accounts.serializers import (
    CustomerProfileSerializer,
    LoginSerializer,
    MeSerializer,
    RegisterSerializer,
    UserSerializer,
)


User = get_user_model()


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
