"""
Staff portal protective routing mixins.
Handles authentication state and system selection routing for staff members.
"""
from django.shortcuts import redirect
from django.urls import reverse
from systems.models import System
from system_roles.models import UserSystemRole


class StaffAuthenticationMixin:
    """
    Mixin to check if user is authenticated as a staff member.
    Sets self.is_authenticated_staff on the view instance.
    """
    
    def dispatch(self, request, *args, **kwargs):
        # Check if user is attached to request and is authenticated
        self.is_authenticated_staff = (
            hasattr(request, 'user') and 
            request.user and 
            request.user.is_authenticated
        )
        return super().dispatch(request, *args, **kwargs)


class StaffLoginRequiredMixin(StaffAuthenticationMixin):
    """
    Mixin that requires staff to be authenticated.
    If not authenticated, redirects to /staff/login/
    """
    
    def dispatch(self, request, *args, **kwargs):
        super().dispatch(request, *args, **kwargs)
        
        if not self.is_authenticated_staff:
            return redirect('auth_login')  # /staff/login/
        
        return super(StaffAuthenticationMixin, self).dispatch(request, *args, **kwargs)


class StaffNotAuthenticatedMixin(StaffAuthenticationMixin):
    """
    Mixin that redirects authenticated staff away from public pages.
    If already authenticated:
    - Single system assigned → Redirect to system dashboard
    - Multiple systems assigned → Redirect to system selection page
    - No systems assigned → Redirect to welcome page
    """
    
    def dispatch(self, request, *args, **kwargs):
        super().dispatch(request, *args, **kwargs)
        
        if self.is_authenticated_staff:
            # Get user's assigned systems
            user_systems = System.objects.filter(
                user_roles__user=request.user,
                user_roles__is_active=True
            ).distinct()
            
            if user_systems.count() == 1:
                # Single system: redirect to system dashboard
                from users.utils import get_system_redirect_url
                system = user_systems.first()
                redirect_url = get_system_redirect_url(request.user, system.slug)
                if redirect_url:
                    return redirect(redirect_url)
            
            if user_systems.count() > 1:
                # Multiple systems: redirect to system welcome/selection page
                return redirect('system-welcome')
            
            # No systems: redirect to welcome page
            return redirect('system-welcome')
        
        return super(StaffAuthenticationMixin, self).dispatch(request, *args, **kwargs)


class StaffEmployeeBlockerMixin(StaffAuthenticationMixin):
    """
    Mixin that blocks authenticated employees from accessing /staff/* endpoints.
    Redirects to /login/ if an employee tries to access staff pages.
    """
    
    def dispatch(self, request, *args, **kwargs):
        super().dispatch(request, *args, **kwargs)
        
        # Check if request has an employee (not a staff user)
        is_employee = hasattr(request, 'employee') and request.employee
        
        if is_employee:
            return redirect('employee-login-shortcut')  # /login/
        
        return super(StaffAuthenticationMixin, self).dispatch(request, *args, **kwargs)


class StaffSystemRedirectMixin(StaffAuthenticationMixin):
    """
    Mixin for protected staff pages that redirects authenticated users
    based on their system assignments.
    
    If accessed by authenticated staff:
    - Single system → Allows access (user working in that system)
    - Multiple systems → Redirects to system selection
    - No systems → Redirects to welcome page
    """
    
    def dispatch(self, request, *args, **kwargs):
        super().dispatch(request, *args, **kwargs)
        
        if not self.is_authenticated_staff:
            return redirect('auth_login')  # /staff/login/
        
        # Check if user has any systems assigned
        user_systems = System.objects.filter(
            user_roles__user=request.user,
            user_roles__is_active=True
        ).distinct()
        
        if user_systems.count() == 0:
            # No systems assigned
            return redirect('system-welcome')
        
        if user_systems.count() > 1:
            # Multiple systems: user must select one
            return redirect('system-welcome')
        
        # Single system: allow access (user has context)
        return super(StaffAuthenticationMixin, self).dispatch(request, *args, **kwargs)
