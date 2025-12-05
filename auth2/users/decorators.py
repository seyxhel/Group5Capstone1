from functools import wraps
from django.shortcuts import redirect
from django.urls import reverse # To dynamically get the login URL
from django.contrib import messages
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from .models import User # Use relative import within the users app

def get_user_from_jwt_cookie(request):
    """
    Attempts to authenticate a user based on the JWT access token in cookies.
    Returns the User object if successful, otherwise None.
    (Copied from hdts/decorators.py - consider moving to a shared location later)
    """
    token_str = request.COOKIES.get('access_token')
    if not token_str:
        return None

    try:
        access_token = AccessToken(token_str)
        # Verify token (checks signature and expiry)
        access_token.verify() 
        
        # Get user ID from payload
        user_id = access_token.payload.get('user_id')
        if not user_id:
            return None
            
        # Fetch user from database
        user = User.objects.get(id=user_id)
        return user
        
    except (InvalidToken, TokenError, User.DoesNotExist):
        # If token is invalid, expired, or user doesn't exist
        return None
    except Exception:
        # Catch any other unexpected errors during token processing
        return None

def jwt_cookie_required(view_func):
    """
    Decorator for views that require the user to be authenticated via JWT cookie.
    Redirects to login if not authenticated via JWT.
    Clears cookies and shows session expired message if token is expired.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Attempt to authenticate using JWT cookie
        token_str = request.COOKIES.get('access_token')
        
        if token_str:
            try:
                access_token = AccessToken(token_str)
                # Verify token (checks signature and expiry)
                access_token.verify() 
                
                # Get user ID from payload
                user_id = access_token.payload.get('user_id')
                if user_id:
                    # Fetch user from database
                    user = User.objects.get(id=user_id)
                    # Attach user to request for the view to use
                    request.user = user
                    # If authenticated, proceed with the view
                    return view_func(request, *args, **kwargs)
                    
            except (InvalidToken, TokenError, User.DoesNotExist):
                # Token is invalid or expired - clear cookies and show message
                messages.warning(request, 'Your session has expired. Please log in again.')
                response = redirect(reverse('auth_login'))
                response.delete_cookie('access_token')
                response.delete_cookie('refresh_token')
                return response
            except Exception:
                # Catch any other unexpected errors during token processing
                pass
        
        # Not authenticated via JWT, redirect to login page
        login_url = reverse('auth_login') 
        # Add the 'next' parameter to redirect back after login
        return redirect(f'{login_url}?next={request.path}') 
        
    return wrapper

def tts_admin_required(view_func):
    """
    Decorator for views that require TTS admin privileges.
    Must be used after jwt_cookie_required decorator.
    Checks if user is a superuser or has Admin role in TTS system.
    Redirects to profile-settings if not authorized.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        user = request.user
        
        # Check if user is superuser or has Admin role in TTS system
        if not user.is_superuser:
            from system_roles.models import UserSystemRole
            is_tts_admin = UserSystemRole.objects.filter(
                user=user,
                system__slug='tts',
                role__name='Admin'
            ).exists()
            
            if not is_tts_admin:
                messages.error(request, 'Access denied. You need TTS admin privileges to access this page.')
                return redirect('profile-settings')
        
        # If authorized, proceed with the view
        return view_func(request, *args, **kwargs)
        
    return wrapper

def system_admin_required(view_func):
    """
    Decorator for views that require admin privileges in any system.
    Must be used after jwt_cookie_required decorator.
    Checks if user is a superuser or has Admin role in any system.
    Redirects to profile-settings if not authorized.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        user = request.user
        
        # Check if user is superuser or has Admin role in any system
        if not user.is_superuser:
            from system_roles.models import UserSystemRole
            is_admin = UserSystemRole.objects.filter(
                user=user,
                role__name='Admin'
            ).exists()
            
            if not is_admin:
                messages.error(request, 'Access denied. You need admin privileges to access this page.')
                return redirect('profile-settings')
        
        # If authorized, proceed with the view
        return view_func(request, *args, **kwargs)
        
    return wrapper
