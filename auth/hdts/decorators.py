from functools import wraps
from django.shortcuts import redirect
from django.urls import reverse # To dynamically get the login URL
from django.core.exceptions import PermissionDenied
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from users.models import User
from system_roles.models import UserSystemRole

def get_user_from_jwt_cookie(request):
    """
    Attempts to authenticate a user based on the JWT access token in cookies.
    Returns the User object if successful, otherwise None.
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

def is_hdts_admin(user):
    """
    Checks if a user has the 'Admin' role in the 'hdts' system.
    Assumes user is already authenticated.
    """
    # Check if the user object exists first
    if not user:
        return False
        
    # Check if the user is a superuser OR has the specific HDTS Admin role
    return user.is_superuser or UserSystemRole.objects.filter(
        user=user,
        system__slug='hdts',
        role__name='Admin'
    ).exists()

def hdts_admin_required(view_func):
    """
    Decorator for views that require the user to be authenticated via JWT cookie
    and be an HDTS Admin.
    Redirects to login if not authenticated via JWT, raises PermissionDenied if not authorized.
    """
    @wraps(view_func)
    def wrapper(request, *args, **kwargs):
        # Attempt to authenticate using JWT cookie
        user = get_user_from_jwt_cookie(request)
        
        if user is None:
            # Not authenticated via JWT, redirect to login page
            # Make sure you have a URL named 'login' or change this URL
            login_url = reverse('login') 
            return redirect(login_url) # Could add '?next=...' if needed
            
        # Attach user to request for the view to use (optional but good practice)
        request.user = user
        
        # Check if the authenticated user is an HDTS admin
        if not is_hdts_admin(user):
            # Logged in via JWT but not authorized for this view
            raise PermissionDenied("You do not have permission to access this page.")
            
        # If authenticated and authorized, proceed with the view
        return view_func(request, *args, **kwargs)
        
    return wrapper