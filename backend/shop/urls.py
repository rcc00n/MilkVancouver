from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path, re_path
from django.views.generic import TemplateView
from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
def csrf_view(request):
    return JsonResponse({"detail": "CSRF cookie set"})

def health_check(_request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/csrf/", csrf_view, name="api-csrf"),
    path("api/auth/", include("accounts.urls")),
    path("api/", include("products.urls")),
    path("api/", include("orders.urls")),
    path("api/delivery/", include("delivery.urls", namespace="delivery")),
    path("api/", include("payments.urls")),
    path("api/", include("contacts.urls")),
    path("api/", include("blog.urls")),
    path("health/", health_check),
    # Serve the SPA for non-API routes
    re_path(r"^(?!admin/|api/|static/|health/).*$", TemplateView.as_view(template_name="index.html")),
]
