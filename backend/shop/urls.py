from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path, re_path
from django.views.generic import TemplateView


def health_check(_request):
    return JsonResponse({"status": "ok"})


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("products.urls")),
    path("api/", include("orders.urls")),
    path("api/", include("payments.urls")),
    path("api/", include("contacts.urls")),
    path("api/", include("blog.urls")),
    path("health/", health_check),
    # Serve the SPA for non-API routes
    re_path(r"^(?!admin/|api/|static/|health/).*$", TemplateView.as_view(template_name="index.html")),
]
