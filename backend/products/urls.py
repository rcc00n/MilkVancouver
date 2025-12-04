from rest_framework.routers import DefaultRouter

from .api import CategoryViewSet, ProductViewSet

router = DefaultRouter()
router.register("products", ProductViewSet, basename="product")
router.register("categories", CategoryViewSet, basename="category")

urlpatterns = router.urls
