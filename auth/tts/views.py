from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from users.models import User
from roles.models import Role
from systems.models import System
from system_roles.models import UserSystemRole
from django.db.models import Q

# Create your views here.

class UserIDsByRoleView(APIView):
    """
    API endpoint for TTS round-robin user selection.
    Returns users that have the specified role_id or role_name.
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        role_id = request.query_params.get('role_id')
        role_name = request.query_params.get('role_name')
        
        if not role_id and not role_name:
            return Response({"error": "Either role_id or role_name parameter is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Get TTS system
            try:
                tts_system = System.objects.get(slug='tts')
                
                # Set up filter for UserSystemRole query
                user_system_role_filter = {'system': tts_system}
                
                # If role_id is provided, try to use it
                if role_id:
                    try:
                        # Convert role_id to integer
                        role_id = int(role_id)
                        user_system_role_filter['role__id'] = role_id
                    except ValueError:
                        return Response({"error": "role_id must be a number."}, status=status.HTTP_400_BAD_REQUEST)
                # If role_name is provided, use case-insensitive matching
                elif role_name:
                    # Use iexact for case-insensitive matching
                    user_system_role_filter['role__name__iexact'] = role_name
                
                # Find users with this role in TTS
                user_system_roles = UserSystemRole.objects.filter(**user_system_role_filter)
                
                # Extract the user IDs
                user_ids = user_system_roles.values_list('user__id', flat=True)
                
                return Response(list(user_ids), status=status.HTTP_200_OK)
            
            except System.DoesNotExist:
                return Response([], status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
