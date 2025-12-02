from rest_framework.permissions import BasePermission
from rest_framework.exceptions import NotAuthenticated

from delivery.models import Driver


class IsDriver(BasePermission):
    message = "You must be registered as a driver to access this endpoint."

    def has_permission(self, request, view):
        user = request.user
        if not user or not user.is_authenticated:
            raise NotAuthenticated()

        return Driver.objects.filter(user=user).exists()
