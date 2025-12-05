"""
Password management views - handles password reset, change, and forgot password flows.
"""

from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiResponse, inline_serializer
import rest_framework.serializers as drf_serializers

from django.shortcuts import render, redirect
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.cache import never_cache
from django.utils.decorators import method_decorator
from django.views.generic import FormView, TemplateView
from django.urls import reverse_lazy
from django.contrib import messages

from ..models import User, UserOTP, PasswordResetToken
from ..serializers import (
    ForgotPasswordSerializer,
    ResetPasswordSerializer,
    ProfilePasswordResetSerializer,
    send_password_reset_email,
)
from ..forms import ForgotPasswordForm


@extend_schema(
    tags=['Password Reset'],
    summary="Request password reset",
    description="Send a password reset email to the user if the email exists in the system. For security reasons, this endpoint always returns success regardless of whether the email exists.",
    request=ForgotPasswordSerializer,
    responses={
        200: OpenApiResponse(
            response=inline_serializer(
                name='ForgotPasswordResponse',
                fields={'message': drf_serializers.CharField()}
            ),
            description="Password reset email sent (if email exists)"
        ),
        400: OpenApiResponse(description="Bad request - invalid email format")
    }
)
class ForgotPasswordView(generics.CreateAPIView):
    """Request password reset via email."""
    permission_classes = [AllowAny]
    serializer_class = ForgotPasswordSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            
            try:
                user = User.objects.get(email=email, is_active=True)
                reset_token = PasswordResetToken.generate_for_user(user)
                
                # Send password reset email
                if send_password_reset_email(user, reset_token, request):
                    message = 'If an account with that email exists, a password reset link has been sent.'
                else:
                    message = 'If an account with that email exists, a password reset link has been sent.'
                    
            except User.DoesNotExist:
                # For security, don't reveal that the email doesn't exist
                message = 'If an account with that email exists, a password reset link has been sent.'
            
            return Response({'message': message}, status=status.HTTP_200_OK)
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@extend_schema(
    tags=['Password Reset'],
    summary="Reset password with token",
    description="Reset user's password using a valid reset token received via email. Token can be provided either as a URL parameter or in the request body.",
    request=ResetPasswordSerializer,
    responses={
        200: OpenApiResponse(
            response=inline_serializer(
                name='ResetPasswordResponse',
                fields={'message': drf_serializers.CharField()}
            ),
            description="Password reset successfully"
        ),
        400: OpenApiResponse(description="Bad request - invalid token or password validation errors")
    }
)
class ResetPasswordView(generics.GenericAPIView):
    """Reset password using reset token."""
    permission_classes = [AllowAny]
    serializer_class = ResetPasswordSerializer
    
    def get(self, request, *args, **kwargs):
        """Render the password reset form."""
        token = request.query_params.get('token', '')
        
        # Check if token is valid before rendering the form
        reset_token = PasswordResetToken.get_valid_token(token)
        if not reset_token:
            context = {
                'error': 'Invalid or expired reset token. Please request a new password reset link.',
                'token_valid': False
            }
        else:
            context = {
                'token': token,
                'token_valid': True
            }
            
        return render(request, 'reset_password.html', context)
        
    def post(self, request, *args, **kwargs):
        """Process the password reset form submission."""
        token = request.POST.get('token') or request.query_params.get('token', '')
        password = request.POST.get('password', '')
        password_confirm = request.POST.get('password_confirm', '')
        
        data = {
            'token': token,
            'password': password,
            'password_confirm': password_confirm
        }
        
        serializer = self.get_serializer(data=data)
        
        if serializer.is_valid():
            reset_token = serializer.validated_data['reset_token']
            password = serializer.validated_data['password']
            
            # Reset the password
            user = reset_token.user
            user.set_password(password)
            user.save(update_fields=['password'])
            
            # Mark token as used
            reset_token.use_token()
            
            # Invalidate all existing OTP codes for security
            UserOTP.objects.filter(user=user, is_used=False).update(is_used=True)
            
            context = {
                'success': True,
                'message': 'Password has been reset successfully. You can now log in with your new password.'
            }
            return render(request, 'users/reset_password_success.html', context)
        
        context = {
            'token': token,
            'token_valid': True,
            'errors': serializer.errors
        }
        return render(request, 'reset_password.html', context)


@extend_schema(
    tags=["User Profile"],
    summary="Reset password from profile",
    description="Authenticated user can reset their password by providing current and new password.",
    request=ProfilePasswordResetSerializer,
    responses={
        200: OpenApiResponse(description="Password reset successful"),
        400: OpenApiResponse(description="Validation error")
    }
)
class ProfilePasswordResetView(generics.GenericAPIView):
    """Allow authenticated user to reset their password."""
    permission_classes = [IsAuthenticated]
    serializer_class = ProfilePasswordResetSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = request.user
        user.set_password(serializer.validated_data['new_password'])
        user.save()
        return Response({"detail": "Password reset successful."}, status=status.HTTP_200_OK)


@method_decorator([csrf_protect, never_cache], name='dispatch')
class ForgotPasswordUIView(FormView):
    """
    UI view for forgot password that matches the DRF ForgotPasswordView validation.
    """
    template_name = 'users/forgot_password.html'
    form_class = ForgotPasswordForm
    success_url = reverse_lazy('auth_login')
    
    def dispatch(self, request, *args, **kwargs):
        # Redirect authenticated users
        if hasattr(request, 'user') and request.user.is_authenticated:
            return redirect(self.success_url)
        return super().dispatch(request, *args, **kwargs)
    
    def get_context_data(self, **kwargs):
        """Add additional context for template"""
        context = super().get_context_data(**kwargs)
        context.update({
            'page_title': 'Forgot Password',
            'login_url': reverse_lazy('auth_login'),
        })
        return context
    
    def form_valid(self, form):
        """Handle successful form submission using the same logic as DRF view"""
        email = form.cleaned_data['email']
        
        try:
            user = User.objects.get(email=email, is_active=True)
            reset_token = PasswordResetToken.generate_for_user(user)
            
            # Send password reset email using the same function as DRF view
            if send_password_reset_email(user, reset_token, self.request):
                message = 'If an account with that email exists, a password reset link has been sent.'
            else:
                message = 'If an account with that email exists, a password reset link has been sent.'
                
        except User.DoesNotExist:
            # For security, don't reveal that the email doesn't exist
            message = 'If an account with that email exists, a password reset link has been sent.'
        
        # Add success message and redirect to login
        messages.success(self.request, message)
        return redirect(self.success_url)
    
    def form_invalid(self, form):
        """Handle form errors"""
        messages.error(self.request, 'Please correct the errors below.')
        return super().form_invalid(form)


@method_decorator([never_cache], name='dispatch')  
class ChangePasswordUIView(TemplateView):
    """UI view for changing password that uses the existing API endpoint."""
    template_name = 'users/change_password.html'
    
    def dispatch(self, request, *args, **kwargs):
        # Check if user is authenticated via JWT token
        from ..authentication import CookieJWTAuthentication
        
        auth = CookieJWTAuthentication()
        try:
            user, validated_token = auth.authenticate(request)
            if user:
                request.user = user
                return super().dispatch(request, *args, **kwargs)
        except Exception:
            pass
        
        # If not authenticated, redirect to login
        return redirect('auth_login')
