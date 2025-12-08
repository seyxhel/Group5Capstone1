# hdts/employee_urls.py
# Separate URL routing for employee endpoints

from django.urls import path
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .employee_api_views import (
    EmployeeRegisterView as EmployeeRegisterAPIView,
    EmployeeTokenObtainPairView,
    EmployeeTokenRefreshView,
    EmployeeLogoutView,
    EmployeeProfileView,
    EmployeeChangePasswordView as EmployeeChangePasswordAPIView,
    RequestEmployeeOTPView,
    VerifyEmployeeOTPView,
    Enable2FAView,
    Disable2FAView,
    EmployeeForgotPasswordView as EmployeeForgotPasswordAPIView,
    EmployeeResetPasswordView as EmployeeResetPasswordAPIView,
)
from .employee_template_views import (
    EmployeeLoginView,
    EmployeeRegisterView,
    EmployeeVerifyOTPView,
    EmployeeForgotPasswordView,
    EmployeeResetPasswordView,
    EmployeeProfileSettingsView,
    EmployeeChangePasswordView,
)



@api_view(['GET'])
def employees_root(request, format=None):
    """API root for Employee-related endpoints."""
    return Response({
        'register': request.build_absolute_uri('register/'),
        'login': request.build_absolute_uri('login/'),
        'logout': request.build_absolute_uri('logout/'),
        'profile': request.build_absolute_uri('profile/'),
        'change_password': request.build_absolute_uri('profile/change-password/'),
        'token_refresh': request.build_absolute_uri('token/refresh/'),
        'password': {
            'forgot': request.build_absolute_uri('password/forgot/'),
            'reset': request.build_absolute_uri('password/reset/'),
        },
        'two_fa': {
            'request_otp': request.build_absolute_uri('2fa/request-otp/'),
            'verify_otp': request.build_absolute_uri('2fa/verify-otp/'),
            'enable': request.build_absolute_uri('2fa/enable/'),
            'disable': request.build_absolute_uri('2fa/disable/'),
        },
        'templates': {
            'login': request.build_absolute_uri('login/'),
            'register': request.build_absolute_uri('register/'),
            'verify_otp': request.build_absolute_uri('verify-otp/'),
            'forgot_password': request.build_absolute_uri('forgot-password/'),
            'reset_password': request.build_absolute_uri('reset-password/'),
            'profile_settings': request.build_absolute_uri('profile-settings/'),
            'change_password': request.build_absolute_uri('change-password/'),
        }
    })



urlpatterns = [
    path('', employees_root, name='employees-root'),
    
    # ========== API ENDPOINTS (json responses) ==========
    path('register/', EmployeeRegisterAPIView.as_view(), name='employee-register-api'),
    path('login/', EmployeeTokenObtainPairView.as_view(), name='employee-login-api'),
    path('token/refresh/', EmployeeTokenRefreshView.as_view(), name='employee-token-refresh'),
    path('logout/', EmployeeLogoutView.as_view(), name='employee-logout'),
    path('profile/', EmployeeProfileView.as_view(), name='employee-profile'),
    path('profile/change-password/', EmployeeChangePasswordAPIView.as_view(), name='employee-change-password-api'),
    
    # Password Reset API Endpoints
    path('password/forgot/', EmployeeForgotPasswordAPIView.as_view(), name='employee-forgot-password-api'),
    path('password/reset/', EmployeeResetPasswordAPIView.as_view(), name='employee-reset-password-api'),
    
    # 2FA Endpoints
    path('2fa/request-otp/', RequestEmployeeOTPView.as_view(), name='employee-request-otp'),
    path('2fa/verify-otp/', VerifyEmployeeOTPView.as_view(), name='employee-verify-otp-api'),
    path('2fa/enable/', Enable2FAView.as_view(), name='employee-enable-2fa'),
    path('2fa/disable/', Disable2FAView.as_view(), name='employee-disable-2fa'),
    
    # ========== TEMPLATE VIEWS (serve HTML) ==========
    path('login/', EmployeeLoginView.as_view(), name='employee-login'),
    path('register/', EmployeeRegisterView.as_view(), name='employee-register'),
    path('verify-otp/', EmployeeVerifyOTPView.as_view(), name='employee-verify-otp'),
    path('forgot-password/', EmployeeForgotPasswordView.as_view(), name='employee-forgot-password'),
    path('reset-password/', EmployeeResetPasswordView.as_view(), name='employee-reset-password'),
    path('profile-settings/', EmployeeProfileSettingsView.as_view(), name='employee-profile-settings'),
    path('change-password/', EmployeeChangePasswordView.as_view(), name='employee-change-password'),
]
