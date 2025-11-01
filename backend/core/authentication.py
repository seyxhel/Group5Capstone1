from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from django.conf import settings


class ExternalUser:
    """
    Represents an external user from cookie authentication.
    Mimics basic user attributes for DRF compatibility.
    """
    def __init__(self, user_id, email, role):
        self.id = user_id
        self.email = email
        self.role = role
        self.is_authenticated = True
        self.is_staff = False
        self.is_superuser = False
        self.pk = user_id  # For DRF compatibility

    def __str__(self):
        return self.email


class CookieJWTAuthentication(JWTAuthentication):
    """
    Custom JWT authentication that reads tokens from cookies (e.g., 'access_token')
    and falls back to standard Authorization header if cookie is missing or invalid.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        simple_jwt_settings = getattr(settings, 'SIMPLE_JWT', {})
        self.user_id_field = simple_jwt_settings.get('USER_ID_FIELD', 'id')
        self.user_id_claim = simple_jwt_settings.get('USER_ID_CLAIM', 'user_id')

    def authenticate(self, request):
        # Try to get token from cookie first
        raw_token = request.COOKIES.get('access_token')

        # No cookie token → fallback to header
        if raw_token is None:
            return super().authenticate(request)

        try:
            # Validate the token from cookie
            validated_token = self.get_validated_token(raw_token)
            
            # Debug logging
            print(f"DEBUG: Token type: {type(validated_token)}")
            print(f"DEBUG: Token dir: {[x for x in dir(validated_token) if not x.startswith('_')]}")
            
            # Try to access 'roles' field - if it exists, treat as external token
            try:
                print(f"DEBUG: Attempting to access 'roles' field")
                roles = validated_token['roles']
                print(f"DEBUG: Successfully accessed roles: {roles}")
                
                # External token with roles - create ExternalUser
                if not isinstance(roles, list):
                    raise ValueError('roles must be a list')
                
                hdts_role = None
                for role_obj in roles:
                    if isinstance(role_obj, dict) and role_obj.get('system') == 'hdts':
                        hdts_role = role_obj.get('role')
                        break
                
                if hdts_role is None:
                    raise ValueError('No valid role found for system hdts')
                
                user = ExternalUser(
                    user_id=validated_token['user_id'],
                    email=validated_token['email'],
                    role=hdts_role
                )
                print(f"DEBUG: Created ExternalUser: {user}")
            except (KeyError, AttributeError, TypeError) as e:
                # No 'roles' field - simple token, use standard user from DB
                print(f"DEBUG: Exception accessing roles: {type(e).__name__}: {e}")
                user = self.get_user(validated_token)
            
            return (user, validated_token)

        except (TokenError, InvalidToken):
            # Invalid or expired cookie token → fallback to header
            return super().authenticate(request)

    def get_user(self, validated_token):
        """
        Returns the user based on the validated token.
        Ensures correct type conversion for user_id.
        """
        # First, check if this token comes from the external auth service
        # which includes a `roles` claim. If so, construct and return an
        # ExternalUser rather than attempting a DB lookup.
        try:
            roles = validated_token['roles']
        except (KeyError, TypeError):
            roles = None

        if roles:
            # Find HDTS role in the roles list
            hdts_role = None
            try:
                for role_obj in roles:
                    if isinstance(role_obj, dict) and role_obj.get('system') == 'hdts':
                        hdts_role = role_obj.get('role')
                        break
            except Exception:
                hdts_role = None

            if hdts_role is None:
                # No HDTS role found; fall back to DB lookup below
                roles = None
            else:
                # Build ExternalUser from token fields
                try:
                    user_id = validated_token.get('user_id') if hasattr(validated_token, 'get') else validated_token[self.user_id_claim]
                except Exception:
                    user_id = validated_token[self.user_id_claim]

                try:
                    email = validated_token.get('email') if hasattr(validated_token, 'get') else validated_token['email']
                except Exception:
                    email = None

                return ExternalUser(user_id=user_id, email=email, role=hdts_role)

        # Fallback: token corresponds to local DB user — perform normal lookup
        try:
            user_id = validated_token[self.user_id_claim]
            user_id = int(user_id) if not isinstance(user_id, int) else user_id
            user = self.user_model.objects.get(**{self.user_id_field: user_id})
            return user

        except (self.user_model.DoesNotExist, ValueError, KeyError) as e:
            raise self.user_model.DoesNotExist(f"No user found with the given token: {str(e)}")
