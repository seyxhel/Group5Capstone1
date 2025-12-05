"""
User management views - handles user CRUD operations and agent management.
"""

from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, OpenApiResponse, extend_schema_view, inline_serializer
import rest_framework.serializers as drf_serializers

from django.shortcuts import render, redirect
from django.contrib import messages

from ..models import User
from ..serializers import (
    UserRegistrationSerializer,
    UserProfileSerializer,
    UserProfileUpdateSerializer,
    AdminUserProfileUpdateSerializer,
)
from permissions import IsSystemAdminOrSuperUser, filter_users_by_system_access
from system_roles.models import UserSystemRole
from ..decorators import jwt_cookie_required


@extend_schema_view(
    list=extend_schema(
        tags=['User Management'],
        summary="List all users",
        description="Retrieve a list of all users. Superusers see all users, system admins see only users in their managed systems.",
        responses={
            200: OpenApiResponse(
                response=inline_serializer(
                    name='UserListResponse',
                    fields={
                        'users_count': drf_serializers.IntegerField(),
                        'users': UserProfileSerializer(many=True)
                    }
                ),
                description="Successfully retrieved user list"
            ),
            401: OpenApiResponse(description="Unauthorized - authentication required"),
            403: OpenApiResponse(description="Forbidden - admin privileges required")
        }
    ),
    retrieve=extend_schema(
        tags=['User Management'],
        summary="Retrieve a specific user",
        description="Get detailed information about a specific user by ID. Access is granted based on user permissions.",
        responses={
            200: OpenApiResponse(response=UserProfileSerializer, description="User details retrieved successfully"),
            401: OpenApiResponse(description="Unauthorized - authentication required"),
            403: OpenApiResponse(description="Forbidden - access denied to this user"),
            404: OpenApiResponse(description="User not found or access denied")
        }
    ),
    create=extend_schema(
        tags=['User Management'],
        summary="Create a new user",
        description="Create a new user. This endpoint is restricted - only superusers can directly create users. System admins should use the admin invite endpoint instead.",
        request=UserRegistrationSerializer,
        responses={
            201: OpenApiResponse(response=UserRegistrationSerializer, description="User created successfully"),
            400: OpenApiResponse(description="Bad request - validation errors"),
            403: OpenApiResponse(description="Forbidden - only superusers can create users directly")
        }
    ),
    update=extend_schema(
        tags=['User Management'],
        summary="Update a user profile (full update)",
        description="Fully update a user's profile. Users can update their own profile with limited fields. Admins can update non-admin users in their systems with extended fields, but cannot edit ID fields. Admins cannot edit other admins.",
        request=AdminUserProfileUpdateSerializer,
        responses={
            200: OpenApiResponse(response=UserProfileSerializer, description="User profile updated successfully"),
            400: OpenApiResponse(description="Bad request - validation errors"),
            403: OpenApiResponse(description="Forbidden - access denied or attempting to edit another admin"),
            404: OpenApiResponse(description="User not found or access denied")
        }
    ),
    partial_update=extend_schema(
        tags=['User Management'],
        summary="Partially update a user profile",
        description="Partially update a user's profile (PATCH). Users can update their own profile with limited fields. Admins can update non-admin users in their systems with extended fields, but cannot edit ID fields. Admins cannot edit other admins.",
        request=AdminUserProfileUpdateSerializer,
        responses={
            200: OpenApiResponse(response=UserProfileSerializer, description="User profile updated successfully"),
            400: OpenApiResponse(description="Bad request - validation errors"),
            403: OpenApiResponse(description="Forbidden - access denied or attempting to edit another admin"),
            404: OpenApiResponse(description="User not found or access denied")
        }
    ),
    destroy=extend_schema(
        tags=['User Management'],
        summary="Delete a user",
        description="Delete a user. This is a restricted operation - only superusers can delete users. Superusers cannot delete other superusers.",
        responses={
            204: OpenApiResponse(description="User deleted successfully"),
            403: OpenApiResponse(description="Forbidden - only superusers can delete users"),
            404: OpenApiResponse(description="User not found or access denied")
        }
    )
)
class UserViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing users with CRUD operations.
    Superusers can see all users, system admins can only see users in their systems.
    Admins can edit agent (non-admin) profiles in their systems but not other admins.
    """
    queryset = User.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsSystemAdminOrSuperUser]

    def get_queryset(self):
        """Filter users based on requesting user's permissions for all operations"""
        queryset = User.objects.all()
        return filter_users_by_system_access(queryset, self.request.user)

    def list(self, request):
        """List users with filtering based on permissions and current system from session"""
        queryset = self.get_queryset()
        
        # Get current system from session
        current_system_slug = request.session.get('last_selected_system')
        
        if current_system_slug:
            # Filter users who have a system role in the current system
            queryset = queryset.filter(
                system_roles__system__slug=current_system_slug
            ).distinct()
        elif not request.user.is_superuser:
            # If no system in session and not superuser, return empty queryset
            queryset = queryset.none()
        
        serializer = self.get_serializer(queryset, many=True, context={'request': request})
        return Response({
            'users_count': queryset.count(),
            'users': serializer.data
        })

    def retrieve(self, request, pk=None):
        """Retrieve a specific user if user has access"""
        try:
            user = self.get_queryset().get(pk=pk)
            serializer = self.get_serializer(user)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found or access denied"}, 
                status=status.HTTP_404_NOT_FOUND
            )

    def create(self, request):
        """Create a new user - restricted for system admins"""
        # System admins cannot create users directly through this endpoint
        # They should use the AdminInviteUserViewSet instead
        if not request.user.is_superuser:
            return Response(
                {"error": "System admins should use the admin invite endpoint to create users"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def update(self, request, pk=None):
        """Update a user if user has access"""
        try:
            user = self.get_queryset().get(pk=pk)
            
            # Users can only update themselves unless they're superuser or admin
            if user == request.user:
                serializer = UserProfileUpdateSerializer(user, data=request.data, context={'request': request})
            elif request.user.is_superuser:
                serializer = AdminUserProfileUpdateSerializer(user, data=request.data, context={'request': request})
            else:
                # Check if requesting user is admin of any system the target user belongs to
                admin_systems = UserSystemRole.objects.filter(
                    user=request.user,
                    role__name='Admin'
                ).values_list('system_id', flat=True)
                
                user_systems = UserSystemRole.objects.filter(
                    user=user
                ).values_list('system_id', flat=True)
                
                # Check for common systems
                common_systems = set(admin_systems).intersection(set(user_systems))
                if not common_systems:
                    return Response(
                        {"error": "Access denied to modify this user"}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Check if target user is NOT an admin in any of those common systems
                target_is_admin = UserSystemRole.objects.filter(
                    user=user,
                    system_id__in=common_systems,
                    role__name='Admin'
                ).exists()
                
                if target_is_admin:
                    return Response(
                        {"error": "Admins cannot edit other admins' profiles"}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                serializer = AdminUserProfileUpdateSerializer(user, data=request.data, context={'request': request})
            
            if serializer.is_valid():
                serializer.save()
                return Response(UserProfileSerializer(user, context={'request': request}).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found or access denied"}, 
                status=status.HTTP_404_NOT_FOUND
            )

    def partial_update(self, request, pk=None):
        """Partial update a user if user has access"""
        try:
            user = self.get_queryset().get(pk=pk)
            
            # Users can only update themselves unless they're superuser or admin
            if user == request.user:
                serializer = UserProfileUpdateSerializer(user, data=request.data, partial=True, context={'request': request})
            elif request.user.is_superuser:
                serializer = AdminUserProfileUpdateSerializer(user, data=request.data, partial=True, context={'request': request})
            else:
                # Check if requesting user is admin of any system the target user belongs to
                admin_systems = UserSystemRole.objects.filter(
                    user=request.user,
                    role__name='Admin'
                ).values_list('system_id', flat=True)
                
                user_systems = UserSystemRole.objects.filter(
                    user=user
                ).values_list('system_id', flat=True)
                
                # Check for common systems
                common_systems = set(admin_systems).intersection(set(user_systems))
                if not common_systems:
                    return Response(
                        {"error": "Access denied to modify this user"}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Check if target user is NOT an admin in any of those common systems
                target_is_admin = UserSystemRole.objects.filter(
                    user=user,
                    system_id__in=common_systems,
                    role__name='Admin'
                ).exists()
                
                if target_is_admin:
                    return Response(
                        {"error": "Admins cannot edit other admins' profiles"}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                serializer = AdminUserProfileUpdateSerializer(user, data=request.data, partial=True, context={'request': request})
            
            if serializer.is_valid():
                serializer.save()
                return Response(UserProfileSerializer(user, context={'request': request}).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found or access denied"}, 
                status=status.HTTP_404_NOT_FOUND
            )

    def destroy(self, request, pk=None):
        """Delete a user - restricted operation"""
        if not request.user.is_superuser:
            return Response(
                {"error": "Only superusers can delete users"}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            user = self.get_queryset().get(pk=pk)
            
            # Prevent deletion of superusers by other superusers
            if user.is_superuser and user != request.user:
                return Response(
                    {"error": "Cannot delete other superusers"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response(
                {"error": "User not found or access denied"}, 
                status=status.HTTP_404_NOT_FOUND
            )


@jwt_cookie_required
def agent_management_view(request):
    """
    Render the agent management page for system admins and superusers.
    This view uses the same permissions as the UserViewSet API.
    """
    user = request.user
    
    # Check if user has permission to manage agents
    if not user.is_superuser:
        # Check if user is a system admin
        is_system_admin = UserSystemRole.objects.filter(
            user=user,
            role__name='Admin'
        ).exists()
        
        if not is_system_admin:
            messages.error(request, 'Access denied. You need admin privileges to access agent management.')
            return redirect('profile-settings')
    
    # Get current system from session
    current_system_slug = request.session.get('last_selected_system', '')
    
    context = {
        'user': user,
        'current_system': current_system_slug,
    }
    return render(request, 'admins/agent_management.html', context)


@jwt_cookie_required
def invite_agent_view(request):
    """
    Render the invite agent page for system admins and superusers.
    This page allows admins to invite new agents to the system.
    """
    user = request.user
    
    # Check if user has permission to invite agents
    if not user.is_superuser:
        # Check if user is a system admin
        is_system_admin = UserSystemRole.objects.filter(
            user=user,
            role__name='Admin'
        ).exists()
        
        if not is_system_admin:
            messages.error(request, 'Access denied. You need admin privileges to invite agents.')
            return redirect('profile-settings')
    
    context = {
        'user': user,
    }
    return render(request, 'admins/invite_agent.html', context)
