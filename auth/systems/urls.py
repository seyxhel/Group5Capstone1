from rest_framework.routers import DefaultRouter
from .views import SystemViewset

router = DefaultRouter()
router.register(r'', SystemViewset, basename='system')

urlpatterns = router.urls
