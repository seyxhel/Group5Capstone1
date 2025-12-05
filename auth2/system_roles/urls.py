from rest_framework.routers import DefaultRouter
from django.urls import path, include
from .views import UserSystemRoleViewSet, AdminInviteUserViewSet, SystemUsersViewSet

router = DefaultRouter()
router.register(r'user-system-roles', UserSystemRoleViewSet, basename='user-system-role')
router.register(r'invite', AdminInviteUserViewSet, basename='admin-invite-user')

# Custom URL patterns for system users endpoint
urlpatterns = [
    path('systems/<slug:system_slug>/users/', 
         SystemUsersViewSet.as_view({'get': 'list'}), 
         name='system-users'),
    path('', include(router.urls)),
]
