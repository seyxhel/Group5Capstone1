"""
Template-based views for employee authentication and profile management.
"""
import logging
from datetime import timedelta
from django.shortcuts import render, redirect
from django.views.generic import TemplateView
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.cache import never_cache
from django.contrib import messages
from django.utils import timezone

from .models import Employees, EmployeeOTP, EmployeePasswordResetToken
from .utils import (
    decode_employee_token,
    generate_employee_tokens,
    set_employee_cookies,
    clear_employee_cookies,
    send_otp_email,
    send_password_change_email,
)

logger = logging.getLogger(__name__)


# ==================== Template-Based Views ====================

@method_decorator([csrf_protect, never_cache], name='dispatch')
class EmployeeLoginView(TemplateView):
    """Template-based login view for employees."""
    template_name = 'hdts/employee_login.html'

    def get(self, request, *args, **kwargs):
        """Handle GET request - redirect if already logged in."""
        access_token = request.COOKIES.get('access_token')
        if access_token:
            try:
                is_valid, payload = decode_employee_token(access_token)
                if is_valid:
                    return redirect('hdts:employee-profile-settings')
            except Exception as e:
                logger.warning(f"Invalid token: {str(e)}")
                # Continue to login page if token invalid

        return super().get(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        """Handle employee login via form."""
        email = request.POST.get('email')
        password = request.POST.get('password')

        if not email or not password:
            messages.error(request, 'Email and password are required.')
            return render(request, self.template_name)

        try:
            employee = Employees.objects.get(email=email)
        except Employees.DoesNotExist:
            messages.error(request, 'Invalid email or password.')
            return render(request, self.template_name)

        # Check if account is locked
        if employee.is_locked:
            if employee.lockout_time and timezone.now() < employee.lockout_time:
                messages.error(request, 'Account is temporarily locked. Please try again later.')
                return render(request, self.template_name)
            else:
                employee.is_locked = False
                employee.failed_login_attempts = 0
                employee.lockout_time = None
                employee.save(update_fields=['is_locked', 'failed_login_attempts', 'lockout_time'])

        # Verify password
        if not employee.check_password(password):
            employee.failed_login_attempts += 1
            if employee.failed_login_attempts >= 5:
                employee.is_locked = True
                employee.lockout_time = timezone.now() + timedelta(minutes=30)
                employee.save(update_fields=['failed_login_attempts', 'is_locked', 'lockout_time'])
                messages.error(request, 'Account locked due to too many failed attempts.')
            else:
                employee.save(update_fields=['failed_login_attempts'])
                messages.error(request, 'Invalid email or password.')
            return render(request, self.template_name)

        # Reset failed attempts
        if employee.failed_login_attempts > 0:
            employee.failed_login_attempts = 0
            employee.save(update_fields=['failed_login_attempts'])

        # Check if 2FA is enabled
        if employee.otp_enabled:
            otp = EmployeeOTP.generate_for_employee(employee)
            send_otp_email(employee, otp.otp_code)

            request.session['otp_email'] = email
            request.session['otp_pending'] = True
            request.session.modified = True
            return redirect('hdts:employee-verify-otp')

        # Update last login
        employee.last_login = timezone.now()
        employee.save(update_fields=['last_login'])

        # Generate tokens
        tokens = generate_employee_tokens(employee)
        
        response = redirect('hdts:employee-profile-settings')
        response = set_employee_cookies(response, tokens['access_token'], tokens['refresh_token'])
        messages.success(request, 'Login successful!')
        return response


class EmployeeVerifyOTPView(TemplateView):
    """Template-based OTP verification view."""
    template_name = 'hdts/employee_verify_otp.html'

    def get(self, request, *args, **kwargs):
        """Handle GET request - check if OTP is pending."""
        if 'otp_pending' not in request.session:
            return redirect('hdts:employee-login')
        return super().get(request, *args, **kwargs)

    def post(self, request, *args, **kwargs):
        """Verify OTP."""
        otp_code = request.POST.get('otp_code')
        email = request.session.get('otp_email')

        if not otp_code or not email:
            messages.error(request, 'Invalid OTP request.')
            return render(request, self.template_name)

        try:
            employee = Employees.objects.get(email=email)
        except Employees.DoesNotExist:
            messages.error(request, 'Invalid email.')
            return redirect('hdts:employee-login')

        otp = EmployeeOTP.get_valid_otp_for_employee(employee)
        
        if not otp or not otp.verify(otp_code):
            messages.error(request, 'Invalid or expired OTP.')
            return render(request, self.template_name)

        # Update last login
        employee.last_login = timezone.now()
        employee.save(update_fields=['last_login'])

        # Clear session
        del request.session['otp_pending']
        del request.session['otp_email']
        request.session.modified = True

        # Generate tokens
        tokens = generate_employee_tokens(employee)
        
        response = redirect('hdts:employee-profile-settings')
        response = set_employee_cookies(response, tokens['access_token'], tokens['refresh_token'])
        messages.success(request, 'Login successful!')
        return response


class EmployeeProfileSettingsView(TemplateView):
    """Template-based profile settings view."""
    template_name = 'hdts/employee_profile.html'

    def dispatch(self, request, *args, **kwargs):
        """Check if employee is authenticated."""
        access_token = request.COOKIES.get('access_token')
        if not access_token:
            logger.warning("No access_token cookie found in profile settings request")
            return redirect('hdts:employee-login')
        
        is_valid, payload = decode_employee_token(access_token)
        if not is_valid:
            logger.warning(f"Token validation failed in profile settings: {payload}")
            return redirect('hdts:employee-login')
        
        # Store payload in request for later use
        request.token_payload = payload

        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        """Add employee data to context."""
        context = super().get_context_data(**kwargs)
        access_token = self.request.COOKIES.get('access_token')
        
        try:
            is_valid, payload = decode_employee_token(access_token)
            if is_valid:
                employee_id = payload.get('employee_id')
                employee = Employees.objects.get(id=employee_id)
                context['employee'] = employee
        except Exception as e:
            logger.error(f"Failed to get employee from token: {str(e)}")

        return context

    def post(self, request, *args, **kwargs):
        """Update employee profile."""
        access_token = request.COOKIES.get('access_token')
        
        try:
            is_valid, payload = decode_employee_token(access_token)
            if not is_valid:
                messages.error(request, 'Authentication failed.')
                return redirect('hdts:employee-login')
            
            employee_id = payload.get('employee_id')
            employee = Employees.objects.get(id=employee_id)
        except Exception as e:
            messages.error(request, 'Authentication failed.')
            return redirect('hdts:employee-login')

        # Update fields
        employee.first_name = request.POST.get('first_name', employee.first_name)
        employee.middle_name = request.POST.get('middle_name', employee.middle_name)
        employee.last_name = request.POST.get('last_name', employee.last_name)
        employee.suffix = request.POST.get('suffix', employee.suffix)
        employee.phone_number = request.POST.get('phone_number', employee.phone_number)
        employee.department = request.POST.get('department', employee.department)

        if 'profile_picture' in request.FILES:
            employee.profile_picture = request.FILES['profile_picture']

        try:
            employee.save()
            messages.success(request, 'Profile updated successfully.')
        except Exception as e:
            messages.error(request, f'Error updating profile: {str(e)}')

        return render(request, self.template_name, self.get_context_data())


class EmployeeChangePasswordView(TemplateView):
    """Template-based password change view."""
    template_name = 'hdts/employee_change_password.html'

    def dispatch(self, request, *args, **kwargs):
        """Check if employee is authenticated."""
        access_token = request.COOKIES.get('access_token')
        if not access_token:
            return redirect('hdts:employee-login')
        
        is_valid, payload = decode_employee_token(access_token)
        if not is_valid:
            return redirect('hdts:employee-login')

        return super().dispatch(request, *args, **kwargs)

    def get_context_data(self, **kwargs):
        """Add employee data to context."""
        context = super().get_context_data(**kwargs)
        access_token = self.request.COOKIES.get('access_token')
        
        try:
            is_valid, payload = decode_employee_token(access_token)
            if is_valid:
                employee_id = payload.get('employee_id')
                employee = Employees.objects.get(id=employee_id)
                context['employee'] = employee
        except Exception as e:
            logger.error(f"Failed to get employee from token: {str(e)}")

        return context

    def post(self, request, *args, **kwargs):
        """Change employee password."""
        access_token = request.COOKIES.get('access_token')
        
        try:
            is_valid, payload = decode_employee_token(access_token)
            if not is_valid:
                messages.error(request, 'Authentication failed.')
                return redirect('hdts:employee-login')
            
            employee_id = payload.get('employee_id')
            employee = Employees.objects.get(id=employee_id)
        except Exception as e:
            messages.error(request, 'Authentication failed.')
            return redirect('hdts:employee-login')

        old_password = request.POST.get('old_password')
        new_password = request.POST.get('new_password')
        confirm_password = request.POST.get('confirm_password')

        if not old_password or not new_password or not confirm_password:
            messages.error(request, 'All fields are required.')
            return render(request, self.template_name, self.get_context_data())

        if not employee.check_password(old_password):
            messages.error(request, 'Old password is incorrect.')
            return render(request, self.template_name, self.get_context_data())

        if new_password != confirm_password:
            messages.error(request, 'New passwords do not match.')
            return render(request, self.template_name, self.get_context_data())

        if len(new_password) < 8:
            messages.error(request, 'Password must be at least 8 characters long.')
            return render(request, self.template_name, self.get_context_data())

        try:
            employee.set_password(new_password)
            employee.save()
            messages.success(request, 'Password changed successfully.')
            
            # Send notification
            send_password_change_email(employee)

        except Exception as e:
            messages.error(request, f'Error changing password: {str(e)}')

        return render(request, self.template_name, self.get_context_data())


class EmployeeLogoutView(TemplateView):
    """Template-based logout view."""
    
    def get(self, request, *args, **kwargs):
        """Logout employee."""
        response = redirect('hdts:employee-login')
        response = clear_employee_cookies(response)
        messages.success(request, 'You have been logged out.')
        return response


class EmployeeForgotPasswordUIView(TemplateView):
    """Template view for forgot password form."""
    template_name = 'hdts/forgot_password.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        return context


class EmployeeResetPasswordUIView(TemplateView):
    """Template view for reset password form."""
    template_name = 'hdts/reset_password.html'
    
    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        token = self.request.GET.get('token')
        
        if token:
            reset_token = EmployeePasswordResetToken.get_valid_token(token)
            if reset_token:
                context['token'] = token
                context['valid'] = True
            else:
                context['valid'] = False
                context['error'] = 'This password reset link is invalid or has expired.'
        else:
            context['valid'] = False
            context['error'] = 'No reset token provided.'
        
        return context
