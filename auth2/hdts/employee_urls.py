# hdts/employee_urls.py
# Separate URL routing for employee endpoints

from django.urls import path
from django.shortcuts import redirect
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .employee_api_views import (
    EmployeeRegisterView,
    EmployeeTokenObtainPairView,
    EmployeeTokenRefreshView,
    EmployeeLogoutView,
    EmployeeProfileView,
    EmployeeChangePasswordView,
    RequestEmployeeOTPView,
    VerifyEmployeeOTPView,
    Enable2FAView,
    Disable2FAView,
    EmployeeForgotPasswordView,
    EmployeeResetPasswordView,
)

app_name = 'hdts'


@api_view(['GET'])
def employees_root(request, format=None):
    """API root for Employee-related endpoints."""
    return Response({
        'register': request.build_absolute_uri('api/v1/register/'),
        'login': request.build_absolute_uri('api/v1/login/'),
        'logout': request.build_absolute_uri('api/v1/logout/'),
        'profile': request.build_absolute_uri('api/v1/profile/'),
        'change_password': request.build_absolute_uri('api/v1/profile/change-password/'),
        'token_refresh': request.build_absolute_uri('api/v1/token/refresh/'),
        'password': {
            'forgot': request.build_absolute_uri('api/v1/password/forgot/'),
            'reset': request.build_absolute_uri('api/v1/password/reset/'),
        },
        'two_fa': {
            'request_otp': request.build_absolute_uri('api/v1/2fa/request-otp/'),
            'verify_otp': request.build_absolute_uri('api/v1/2fa/verify-otp/'),
            'enable': request.build_absolute_uri('api/v1/2fa/enable/'),
            'disable': request.build_absolute_uri('api/v1/2fa/disable/'),
        },
        'ui': {
            'login': request.build_absolute_uri('login/'),
            'verify_otp': request.build_absolute_uri('verify-otp/'),
            'profile_settings': request.build_absolute_uri('profile-settings/'),
            'forgot_password': request.build_absolute_uri('forgot-password/'),
            'reset_password': request.build_absolute_uri('reset-password/'),
        }
    })


# Redirect functions for template views (redirect to root-level shortcuts)
def redirect_login_ui(request):
    """Redirect to the root-level login shortcut"""
    return redirect('employee-login-shortcut')


def redirect_verify_otp(request):
    """Redirect to the root-level verify OTP shortcut"""
    return redirect('employee-verify-otp-shortcut')


def redirect_profile_settings(request):
    """Redirect to the root-level profile settings shortcut"""
    return redirect('employee-profile-settings-shortcut')


urlpatterns = [
    path('', employees_root, name='employees-root'),
    
    # ========== API ENDPOINTS (api/v1/hdts/employees/api/...) ==========
    path('api/v1/register/', EmployeeRegisterView.as_view(), name='employee-register'),
    path('api/v1/login/', EmployeeTokenObtainPairView.as_view(), name='employee-login-api'),
    path('api/v1/token/refresh/', EmployeeTokenRefreshView.as_view(), name='employee-token-refresh'),
    path('api/v1/logout/', EmployeeLogoutView.as_view(), name='employee-logout'),
    path('api/v1/profile/', EmployeeProfileView.as_view(), name='employee-profile'),
    path('api/v1/profile/change-password/', EmployeeChangePasswordView.as_view(), name='employee-change-password-api'),
    
    # Password Reset API Endpoints
    path('api/v1/password/forgot/', EmployeeForgotPasswordView.as_view(), name='employee-forgot-password-api'),
    path('api/v1/password/reset/', EmployeeResetPasswordView.as_view(), name='employee-reset-password-api'),
    
    # 2FA Endpoints
    path('api/v1/2fa/request-otp/', RequestEmployeeOTPView.as_view(), name='employee-request-otp'),
    path('api/v1/2fa/verify-otp/', VerifyEmployeeOTPView.as_view(), name='employee-verify-otp-api'),
    path('api/v1/2fa/enable/', Enable2FAView.as_view(), name='employee-enable-2fa'),
    path('api/v1/2fa/disable/', Disable2FAView.as_view(), name='employee-disable-2fa'),
    
    # ========== TEMPLATE VIEWS (HTML responses - redirect to root-level shortcuts) ==========
    path('login/', redirect_login_ui, name='employee-login-ui'),
    path('verify-otp/', redirect_verify_otp, name='employee-verify-otp-ui'),
    path('profile-settings/', redirect_profile_settings, name='employee-profile-settings-ui'),
]
