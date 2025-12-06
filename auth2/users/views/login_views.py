"""
Login and authentication flow views - handles user login, OTP for login, and system welcome page.
"""

from rest_framework.response import Response
from rest_framework.exceptions import ValidationError
import logging

from django.views.decorators.csrf import csrf_protect
from django.views.decorators.cache import never_cache
from django.utils.decorators import method_decorator
from django.views.generic import FormView
from django.shortcuts import redirect
from django.contrib.auth import login
from django.contrib import messages
from django.urls import reverse_lazy
from django.http import JsonResponse, HttpResponseServerError
from django.views.generic import TemplateView

from rest_framework_simplejwt.tokens import RefreshToken, AccessToken
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from django.conf import settings

from systems.models import System
from ..models import User, UserOTP
from ..forms import LoginForm
from ..serializers import CustomTokenObtainPairSerializer
from ..decorators import jwt_cookie_required
from ..utils import create_system_redirect_response
from ..rate_limiting import (
    check_login_rate_limits,
    record_failed_login_attempt,
    record_successful_login,
    get_client_ip,
    generate_device_fingerprint
)

logger = logging.getLogger(__name__)


@method_decorator([csrf_protect, never_cache], name='dispatch')
class LoginView(FormView):
    """
    Custom login view with support for:
    - Email/password authentication
    - 2FA OTP verification
    - System selection
    - Captcha protection
    - Remember me functionality
    - Account lockout protection
    """
    template_name = 'users/login.html'
    form_class = LoginForm
    success_url = reverse_lazy('system-welcome')
    OTP_ERROR_CODES = {'otp_required', 'otp_invalid', 'otp_expired'}
    
    def dispatch(self, request, *args, **kwargs):
        """Redirect authenticated users to their system dashboard"""
        user = None
        invalid_token = False
        
        # First check Django session authentication
        if request.user.is_authenticated:
            user = request.user
        else:
            # Check JWT token in cookie
            access_token = request.COOKIES.get('access_token')
            if access_token:
                try:
                    token = AccessToken(access_token)
                    # Verify token (checks signature and expiry)
                    token.verify()
                    user_id = token.get('user_id')
                    user = User.objects.get(id=user_id)
                except (TokenError, InvalidToken, User.DoesNotExist):
                    user = None
                    invalid_token = True
        
        # If token is invalid, clear it from request to prevent further processing
        if invalid_token:
            # Remove the invalid tokens from the request's COOKIES dict
            # This prevents downstream code from using the invalid token
            request.COOKIES.pop('access_token', None)
            request.COOKIES.pop('refresh_token', None)
        
        # If user is authenticated, redirect to their system
        if user:
            from users.utils import get_system_redirect_url

            access_token = request.COOKIES.get('access_token')
            system_slug = request.GET.get('system')

            if system_slug:
                redirect_url = get_system_redirect_url(user, system_slug)
                if redirect_url:
                    if access_token:
                        separator = '&' if '?' in redirect_url else '?'
                        redirect_url += f"{separator}token={access_token}"
                    request.session['last_selected_system'] = system_slug
                    return redirect(redirect_url)
                messages.error(request, 'You do not have access to the requested system.')

            available_systems = System.objects.filter(
                user_roles__user=user,
                user_roles__is_active=True
            ).distinct()

            if not available_systems.exists():
                messages.error(request, 'No systems are assigned to your account. Please contact support.')
                return redirect('system-welcome')

            if available_systems.count() == 1:
                selected_system = available_systems.first()
                redirect_url = get_system_redirect_url(user, selected_system.slug)
                if redirect_url:
                    if access_token:
                        separator = '&' if '?' in redirect_url else '?'
                        redirect_url += f"{separator}token={access_token}"
                    request.session['last_selected_system'] = selected_system.slug
                    return redirect(redirect_url)
                logger.error(f'System redirect URL is None for system: {selected_system.slug}')
                messages.error(request, f'System "{selected_system.name}" is not properly configured. Please contact support.')
                return redirect('system-welcome')

            return redirect('system-welcome')
        
        # Proceed with normal dispatch and clear invalid cookies from response
        response = super().dispatch(request, *args, **kwargs)
        if invalid_token:
            response.delete_cookie('access_token', path='/')
            response.delete_cookie('refresh_token', path='/')
        
        return response
    
    def get(self, request, *args, **kwargs):
        """Handle GET requests - clear OTP session if going back to login page"""
        session_cleared = False
        
        if 'otp_email' in request.session:
            del request.session['otp_email']
            session_cleared = True
        if 'otp_password' in request.session:
            del request.session['otp_password']
            session_cleared = True
        if session_cleared:
            request.session.modified = True
        
        return super().get(request, *args, **kwargs)
    
    def post(self, request, *args, **kwargs):
        """Handle POST requests for login"""
        # Check rate limits first
        user_email = request.POST.get('email') or request.session.get('otp_email')
        rate_limit_check = check_login_rate_limits(request, user_email=user_email)
        request.rate_limit_state = rate_limit_check
        
        # If IP is blocked, show error
        if not rate_limit_check['login_allowed']:
            messages.error(
                request,
                'Too many login attempts. Please try again later.'
            )
            return self.form_invalid(self.get_form())
        
        return super().post(request, *args, **kwargs)
    
    def get_form_kwargs(self):
        """Pass request and system parameter to form"""
        kwargs = super().get_form_kwargs()
        kwargs['request'] = self.request
        kwargs['rate_limit_state'] = getattr(self.request, 'rate_limit_state', None)
        return kwargs
    
    def get_context_data(self, **kwargs):
        """Add additional context for template"""
        context = super().get_context_data(**kwargs)
        context.update({
            'forgot_password_url': reverse_lazy('forgot-password-ui'),
            'register_url': reverse_lazy('user-register'),
            'page_title': 'Sign In',
            'systems_count': System.objects.count(),
        })
        return context
    
    def form_valid(self, form):
        """Handle successful form submission with JWT token authentication"""
        user = form.get_user()
        remember_me = form.cleaned_data.get('remember_me', False)

        # Preserve password before clearing session state (OTP flow)
        session_password = self.request.session.get('otp_password')
        password = form.cleaned_data.get('password') or session_password or ''

        # Clear OTP session data stored during multi-step login
        for key in ('otp_email', 'otp_password'):
            if key in self.request.session:
                del self.request.session[key]

        # Prepare JWT serializer payload
        serializer_data = {
            'username': user.email,
            'email': user.email,
            'password': password,
            'otp_code': form.cleaned_data.get('otp_code', '')
        }

        serializer = CustomTokenObtainPairSerializer(
            data=serializer_data,
            context={'request': self.request}
        )

        if serializer.is_valid():
            tokens = serializer.validated_data
            access_token = tokens['access']
            refresh_token = tokens['refresh']
        else:
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)

        # Reset failed login attempts
        user.failed_login_attempts = 0
        user.is_locked = False
        user.lockout_time = None
        user.save(update_fields=["failed_login_attempts", "is_locked", "lockout_time"])

        # Record successful login for rate limiting (pass user email)
        record_successful_login(self.request, user_email=user.email)

        available_systems = System.objects.filter(
            user_roles__user=user,
            user_roles__is_active=True
        ).distinct()
        system_count = available_systems.count()

        selected_system = None
        redirect_target_url = None

        if system_count == 1:
            selected_system = available_systems.first()
            from users.utils import get_system_redirect_url
            redirect_target_url = get_system_redirect_url(user, selected_system.slug)
            if redirect_target_url:
                separator = '&' if '?' in redirect_target_url else '?'
                redirect_target_url += f"{separator}token={access_token}"
                self.request.session['last_selected_system'] = selected_system.slug
            else:
                logger.error(f'System redirect URL is None for system: {selected_system.slug}')
                messages.error(
                    self.request,
                    f'System "{selected_system.name}" is not properly configured. Please contact support.'
                )
                return HttpResponseServerError(
                    f'System "{selected_system.name}" (slug: {selected_system.slug}) URL not configured.'
                )
        elif system_count == 0:
            messages.error(
                self.request,
                'Your account is not assigned to any systems yet. Please contact support.'
            )

        next_url = self.request.GET.get('next')

        if next_url:
            response = redirect(next_url)
        elif redirect_target_url:
            response = redirect(redirect_target_url)
        else:
            response = redirect('system-welcome')

        # Set cookie durations based on remember_me selection
        if remember_me:
            access_max_age = 30 * 24 * 60 * 60  # 30 days
            refresh_max_age = 30 * 24 * 60 * 60
        else:
            access_max_age = settings.SIMPLE_JWT['ACCESS_TOKEN_LIFETIME'].total_seconds()
            refresh_max_age = settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].total_seconds()

        response.set_cookie(
            'access_token',
            access_token,
            max_age=access_max_age,
            httponly=False,
            secure=settings.SESSION_COOKIE_SECURE,
            samesite='Lax',
            path='/',
            domain=None
        )

        response.set_cookie(
            'refresh_token',
            refresh_token,
            max_age=refresh_max_age,
            httponly=False,
            secure=settings.SESSION_COOKIE_SECURE,
            samesite='Lax',
            path='/',
            domain=None
        )

        if selected_system:
            messages.success(
                self.request,
                f'Welcome back! Redirecting you to {selected_system.name}.'
            )
        elif system_count > 1:
            messages.success(self.request, 'Welcome back! Select a system to continue.')
        else:
            messages.success(self.request, 'Welcome back!')

        return response
    
    def form_invalid(self, form):
        """Handle form errors and record failed login attempts using PRG pattern"""
        errors = form.errors
        non_field_errors = form.non_field_errors()
        error_str = str(errors) + str(non_field_errors)
        error_codes = self._get_error_codes(form)
        
        # Extract email for rate limiting
        user_email = form.data.get('email') or self.request.session.get('otp_email')
        
        # Check if this is an OTP-related error (invalid/expired/missing OTP)
        # These should NOT count as failed login attempts since credentials were already validated
        is_otp_error = bool(self.OTP_ERROR_CODES.intersection(error_codes))
        
        # Record failed login attempt (skip if OTP error since credentials were valid)
        record_failed_login_attempt(self.request, user_email=user_email, skip_for_otp_error=is_otp_error)
        
        # Check for account lockout
        if 'account_locked' in error_codes:
            lockout_message = None
            for error in non_field_errors:
                if getattr(error, 'code', '') == 'account_locked':
                    lockout_message = str(error)
                    break
            
            if not lockout_message:
                lockout_message = 'Your account is locked due to too many failed login attempts. Please try again later or contact support.'
            
            messages.error(self.request, lockout_message)
            # PRG: Redirect to GET to prevent form resubmission on refresh
            return redirect('auth_login')
        
        # Check if OTP is required - keep this as render since it's a continuation, not an error
        if 'otp_required' in error_codes:
            self.request.session['otp_email'] = form.data.get('email')
            self.request.session['otp_password'] = form.data.get('password')
            
            context = self.get_context_data(form=form)
            context['two_factor_required'] = True
            context['email_value'] = form.data.get('email')
            
            if hasattr(form, '_errors'):
                form._errors.pop('__all__', None)
                form._errors.pop('non_field_errors', None)
            
            messages.info(
                self.request,
                'Two-Factor Authentication is enabled on your account. Please enter your OTP code.'
            )
            
            return self.render_to_response(context)
        
        # Handle other specific errors - set messages and redirect
        if 'captcha' in errors:
            messages.error(self.request, 'Please solve the captcha correctly.')
        elif 'hcaptcha' in errors:
            messages.error(self.request, 'Please complete the security verification correctly.')
        elif is_otp_error:
            otp_message = None
            for error in non_field_errors:
                if getattr(error, 'code', None) in self.OTP_ERROR_CODES:
                    otp_message = str(error)
                    break
            messages.error(self.request, otp_message or 'Invalid or expired OTP code. Please try again.')
        elif any('invalid' in str(error).lower() and ('email' in str(error).lower() or 'password' in str(error).lower()) for error in non_field_errors):
            messages.error(
                self.request, 
                'Invalid email or password. Please check your credentials and try again.'
            )
        else:
            if non_field_errors:
                messages.error(self.request, str(non_field_errors[0]))
            else:
                messages.error(
                    self.request, 
                    'Login failed. Please check your credentials and try again.'
                )
        
        # PRG: Redirect to GET to prevent form resubmission on refresh
        return redirect('auth_login')

    def _get_error_codes(self, form):
        """Extract validation error codes from the form for precise branching."""
        codes = set()
        error_dict = form.errors.as_data() if hasattr(form.errors, 'as_data') else {}
        for field_errors in error_dict.values():
            for error in field_errors:
                code = getattr(error, 'code', None)
                if code:
                    codes.add(code)
        non_field_errors = form.non_field_errors()
        if hasattr(non_field_errors, 'as_data'):
            for error in non_field_errors.as_data():
                code = getattr(error, 'code', None)
                if code:
                    codes.add(code)
        return codes


@csrf_protect
@never_cache
def request_otp_for_login(request):
    """View to request OTP for login when 2FA is enabled."""
    if request.method == 'POST':
        email = request.POST.get('email')
        if email:
            try:
                user = User.objects.get(email=email, is_active=True)
                if user.otp_enabled:
                    otp_instance = UserOTP.generate_for_user(user, otp_type='email')
                    
                    try:
                        from django.core.mail import send_mail
                        
                        send_mail(
                            subject='Your Login OTP Code',
                            message=f'Your OTP code is: {otp_instance.code}\n\nThis code will expire in 10 minutes.',
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            recipient_list=[user.email],
                            fail_silently=False,
                        )
                        
                        messages.success(
                            request, 
                            'OTP code has been sent to your email address.'
                        )
                    except Exception as e:
                        messages.error(
                            request, 
                            'Failed to send OTP. Please try again or contact support.'
                        )
                else:
                    messages.info(
                        request, 
                        'This account does not have 2FA enabled.'
                    )
            except User.DoesNotExist:
                messages.success(
                    request, 
                    'If the email exists and has 2FA enabled, an OTP code has been sent.'
                )
    
    return redirect('auth_login')


@method_decorator(jwt_cookie_required, name='dispatch')
class SystemWelcomeView(TemplateView):
    """Post-login system selection view."""

    template_name = 'users/system_select.html'

    def get_user_systems(self):
        return System.objects.filter(
            user_roles__user=self.request.user,
            user_roles__is_active=True
        ).distinct().order_by('name')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        systems = kwargs.get('systems')
        if systems is None:
            systems = list(self.get_user_systems())
        context.update({
            'systems': systems,
            'page_title': 'Select a System'
        })
        return context

    def get(self, request, *args, **kwargs):
        system_slug = request.GET.get('system')

        if system_slug:
            response = create_system_redirect_response(request, system_slug, include_token=True)
            if response:
                request.session['last_selected_system'] = system_slug
                return response
            messages.error(request, 'You do not have access to the requested system or it is not configured.')

        systems = list(self.get_user_systems())

        if not systems:
            messages.error(request, 'No systems are assigned to your account. Please contact support.')
            return self.render_to_response(self.get_context_data(systems=systems))

        if len(systems) == 1 and not system_slug:
            sole_system = systems[0]
            request.session['last_selected_system'] = sole_system.slug
            response = create_system_redirect_response(request, sole_system.slug, include_token=True)
            if response:
                return response
            messages.error(request, f'System "{sole_system.name}" is not properly configured. Please contact support.')

        return self.render_to_response(self.get_context_data(systems=systems))

    def post(self, request, *args, **kwargs):
        system_slug = request.POST.get('system_slug') or request.POST.get('system')

        if not system_slug:
            messages.error(request, 'Please select a system to continue.')
            return self.get(request, *args, **kwargs)

        system_map = {system.slug: system for system in self.get_user_systems()}
        selected_system = system_map.get(system_slug)

        if not selected_system:
            messages.error(request, 'You do not have access to the selected system.')
            return self.get(request, *args, **kwargs)


        request.session['last_selected_system'] = selected_system.slug
        response = create_system_redirect_response(request, selected_system.slug, include_token=True)

        if response:
            return response

        messages.error(request, f'System "{selected_system.name}" is not properly configured. Please contact support.')
        return self.get(request, *args, **kwargs)


# API-based login endpoint with reCAPTCHA
from rest_framework.views import APIView
from rest_framework.permissions import AllowAny


class LoginAPIView(APIView):
    """
    API endpoint for login with reCAPTCHA verification.
    POST /api/v1/users/login/api/
    {
        "email": "user@example.com",
        "password": "password",
        "g_recaptcha_response": "response-from-client"
    }
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        from ..serializers import LoginWithRecaptchaSerializer
        
        serializer = LoginWithRecaptchaSerializer(data=request.data)
        
        if serializer.is_valid():
            user = serializer.validated_data['user']
            
            # Generate tokens
            refresh = RefreshToken.for_user(user)
            access_token = str(refresh.access_token)
            refresh_token = str(refresh)
            
            # Reset failed login attempts
            user.failed_login_attempts = 0
            user.is_locked = False
            user.lockout_time = None
            user.save(update_fields=["failed_login_attempts", "is_locked", "lockout_time"])
            
            # Record successful login
            record_successful_login(request, user_email=user.email)
            
            return Response({
                'success': True,
                'access_token': access_token,
                'refresh_token': refresh_token,
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'first_name': user.first_name,
                    'last_name': user.last_name,
                }
            })
        else:
            record_failed_login_attempt(request, user_email=request.data.get('email'))
            
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=400)
