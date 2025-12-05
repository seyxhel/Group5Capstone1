from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import SystemRolesViewset, RegisterViewset

router = DefaultRouter()
router.register(r'', SystemRolesViewset, basename='role')

urlpatterns = router.urls + [
    path('register/', RegisterViewset.as_view({'post': 'create'}), name='role-register'),
]
