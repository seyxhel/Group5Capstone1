from django.urls import path
from rest_framework.routers import DefaultRouter
from .views import SystemViewset, PublicSystemsListView

router = DefaultRouter()
router.register(r'', SystemViewset, basename='system')

urlpatterns = [
    path('public/', PublicSystemsListView.as_view(), name='public-systems'),
] + router.urls
