from rest_framework import viewsets
from .models import APIKey
from .serializers import APIKeySerializer
from rest_framework.permissions import IsAdminUser

class APIKeyViewSet(viewsets.ModelViewSet):
    queryset = APIKey.objects.all()
    serializer_class = APIKeySerializer
    permission_classes = [IsAdminUser]
