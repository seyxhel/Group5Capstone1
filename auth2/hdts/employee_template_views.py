"""
Simple template views for employee templates.
These views serve HTML templates without any logic.
All API calls are made via JavaScript from the client side.
"""
from django.shortcuts import render
from django.views.generic import TemplateView
from django.contrib.auth.mixins import LoginRequiredMixin
from rest_framework.permissions import AllowAny
from .models import Employees


class EmployeeLoginView(TemplateView):
    """Serve the employee login template."""
    template_name = 'hdts/employee_login.html'
    permission_classes = [AllowAny]

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context


class EmployeeRegisterView(TemplateView):
    """Serve the employee registration template."""
    template_name = 'hdts/register.html'
    permission_classes = [AllowAny]

    def get_context_data(self, **kwargs):
        from .forms import UserRegistrationForm
        context = super().get_context_data(**kwargs)
        context['form'] = UserRegistrationForm()
        return context


class EmployeeVerifyOTPView(TemplateView):
    """Serve the OTP verification template."""
    template_name = 'hdts/employee_verify_otp.html'
    permission_classes = [AllowAny]

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context


class EmployeeForgotPasswordView(TemplateView):
    """Serve the forgot password template."""
    template_name = 'hdts/forgot_password.html'
    permission_classes = [AllowAny]

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context


class EmployeeResetPasswordView(TemplateView):
    """Serve the reset password template."""
    template_name = 'hdts/reset_password.html'
    permission_classes = [AllowAny]

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Get the token from query params
        token = self.request.GET.get('token', '')
        context['token'] = token
        context['valid'] = bool(token)  # Simple check - ideally validate on the API
        return context


class EmployeeDashboardView(TemplateView):
    """Serve the employee dashboard template."""
    template_name = 'hdts/employee_dashboard.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context


class EmployeeProfileSettingsView(TemplateView):
    """Serve the employee profile settings template with employee data."""
    template_name = 'hdts/employee_profile.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        
        # Get the employee from the authorization header or session
        try:
            # Try to get from the request's employee (if set by middleware)
            if hasattr(self.request, 'employee'):
                context['employee'] = self.request.employee
            else:
                # Try to get from user if available
                context['employee'] = None
        except Exception:
            context['employee'] = None
            
        return context


class EmployeeChangePasswordView(TemplateView):
    """Serve the employee change password template."""
    template_name = 'hdts/employee_change_password.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context


class EmployeeLogoutView(TemplateView):
    """Handle employee logout and redirect to login."""
    template_name = 'hdts/employee_login.html'

    def get(self, request, *args, **kwargs):
        # Clear any session data or cookies if needed
        return super().get(request, *args, **kwargs)


class EmployeeForgotPasswordUIView(TemplateView):
    """Alias for EmployeeForgotPasswordView for backward compatibility."""
    template_name = 'hdts/forgot_password.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context


class EmployeeResetPasswordUIView(TemplateView):
    """Alias for EmployeeResetPasswordView for backward compatibility."""
    template_name = 'hdts/reset_password.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        # Get the token from query params
        token = self.request.GET.get('token', '')
        context['token'] = token
        context['valid'] = bool(token)
        return context
