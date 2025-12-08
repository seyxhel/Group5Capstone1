"""
CAPTCHA views - handles CAPTCHA generation, verification, and requirement checking.
"""

from rest_framework import generics, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
import rest_framework.serializers as drf_serializers
from drf_spectacular.utils import extend_schema, OpenApiResponse, inline_serializer

import uuid


class CaptchaGenerateSerializer(drf_serializers.Serializer):
    """Serializer for CAPTCHA generation response."""
    image = drf_serializers.CharField()
    session_id = drf_serializers.CharField()


class CaptchaVerifySerializer(drf_serializers.Serializer):
    """Serializer for CAPTCHA verification."""
    session_id = drf_serializers.CharField()
    response = drf_serializers.CharField()


@extend_schema(
    tags=['CAPTCHA'],
    summary="Generate a CAPTCHA challenge",
    description="Generates a new CAPTCHA image and returns it as base64-encoded PNG. Used to prevent brute-force attacks on the login endpoint.",
    responses={
        200: OpenApiResponse(
            response=CaptchaGenerateSerializer,
            description="CAPTCHA generated successfully. The image is returned as a base64-encoded PNG data URI."
        )
    }
)
class CaptchaGenerateView(generics.CreateAPIView):
    """
    API view to generate a new CAPTCHA challenge.
    
    POST: Generate and return a new CAPTCHA image as base64-encoded PNG.
    """
    permission_classes = (AllowAny,)
    serializer_class = CaptchaGenerateSerializer
    
    def create(self, request, *args, **kwargs):
        """Generate a new CAPTCHA."""
        from users.captcha import CaptchaService
        
        # Generate a unique session ID for this CAPTCHA
        session_id = str(uuid.uuid4())
        
        # Generate CAPTCHA
        captcha_data = CaptchaService.generate(session_id)
        
        return Response(captcha_data, status=status.HTTP_200_OK)


@extend_schema(
    tags=['CAPTCHA'],
    summary="Verify a CAPTCHA response",
    description="Verifies that the user's CAPTCHA response matches the generated challenge.",
    request=CaptchaVerifySerializer,
    responses={
        200: OpenApiResponse(
            response=inline_serializer(
                name='CaptchaVerifyResponse',
                fields={'valid': drf_serializers.BooleanField(), 'session_id': drf_serializers.CharField()}
            ),
            description="CAPTCHA verification result."
        ),
        400: OpenApiResponse(
            response=inline_serializer(
                name='CaptchaVerifyError',
                fields={'detail': drf_serializers.CharField()}
            ),
            description="Bad Request. Missing or invalid session_id or response."
        )
    }
)
class CaptchaVerifyView(generics.CreateAPIView):
    """
    API view to verify a CAPTCHA response.
    
    POST: Verify the user's CAPTCHA response against the challenge.
    """
    permission_classes = (AllowAny,)
    serializer_class = CaptchaVerifySerializer
    
    def create(self, request, *args, **kwargs):
        """Verify a CAPTCHA response."""
        from users.captcha import CaptchaService
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        session_id = serializer.validated_data.get('session_id')
        response = serializer.validated_data.get('response')
        
        # Verify CAPTCHA
        is_valid = CaptchaService.verify(session_id, response)
        
        if is_valid:
            # Clear the CAPTCHA from cache after successful verification
            CaptchaService.clear_captcha(session_id)
        
        return Response(
            {'valid': is_valid, 'session_id': session_id},
            status=status.HTTP_200_OK
        )


@extend_schema(
    tags=['CAPTCHA'],
    summary="Check if CAPTCHA is required",
    description="Check if CAPTCHA is required for a given email address based on failed login attempts.",
    responses={
        200: OpenApiResponse(
            response=inline_serializer(
                name='CaptchaRequiredResponse',
                fields={
                    'required': drf_serializers.BooleanField(),
                    'email': drf_serializers.EmailField(),
                    'failed_attempts': drf_serializers.IntegerField()
                }
            ),
            description="CAPTCHA requirement status."
        )
    }
)
@api_view(['GET'])
@permission_classes([AllowAny])
def captcha_required_view(request):
    """
    Check if CAPTCHA is required for a given email.
    
    Query Parameters:
    - email: The user's email address
    """
    from users.captcha import CaptchaService
    
    email = request.query_params.get('email')
    
    if not email:
        return Response(
            {'detail': 'email parameter is required'},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    failed_attempts = CaptchaService.get_failed_attempts(email)
    required = CaptchaService.should_require_captcha(email)
    
    return Response({
        'required': required,
        'email': email,
        'failed_attempts': failed_attempts
    })
