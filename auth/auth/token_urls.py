from django.urls import path
from rest_framework_simplejwt.views import (
    TokenRefreshView,
    TokenVerifyView,
)
from rest_framework.response import Response
from rest_framework.decorators import api_view
from rest_framework import serializers
from drf_spectacular.utils import extend_schema, extend_schema_view
from drf_spectacular.openapi import AutoSchema
from users.views import CustomTokenObtainPairView

# Create custom views with tags for the standard JWT views
@extend_schema_view(
    post=extend_schema(tags=['Tokens'], summary="Refresh JWT token", description="Refresh an expired JWT access token using a valid refresh token")
)
class CustomTokenRefreshView(TokenRefreshView):
    pass

@extend_schema_view(
    post=extend_schema(tags=['Tokens'], summary="Verify JWT token", description="Verify if a JWT token is valid and not expired")
)
class CustomTokenVerifyView(TokenVerifyView):
    pass

class TokenRootSerializer(serializers.Serializer):
    obtain = serializers.URLField()
    refresh = serializers.URLField()
    verify = serializers.URLField()

@extend_schema(
    tags=['Tokens'], 
    summary="Token endpoints", 
    description="Available token management endpoints",
    responses={200: TokenRootSerializer}
)
@api_view(['GET'])
def token_root(request):
    return Response({
        "obtain": request.build_absolute_uri("obtain/"),
        "refresh": request.build_absolute_uri("refresh/"),
        "verify": request.build_absolute_uri("verify/"),
    })

urlpatterns = [
    path('', token_root, name='token_root'),  # GET /token/
    path('obtain/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),  # POST /token/obtain/
    path('refresh/', CustomTokenRefreshView.as_view(), name='token_refresh'),        # POST /token/refresh/
    path('verify/', CustomTokenVerifyView.as_view(), name='token_verify'),           # POST /token/verify/
]
