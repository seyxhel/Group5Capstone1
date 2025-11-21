from rest_framework import viewsets, status, mixins, permissions
from rest_framework.response import Response
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.decorators import action
from drf_spectacular.utils import extend_schema_view, extend_schema, OpenApiParameter
from drf_spectacular.openapi import OpenApiTypes
from django.shortcuts import get_object_or_404

from .models import UserSystemRole
from .serializers import (
    UserSystemRoleSerializer, 
    AdminInviteUserSerializer, 
    SystemUsersSerializer,
    CreateUserSystemRoleSerializer,
    SystemRoleListSerializer
)
from systems.models import System
from roles.models import Role
from permissions import IsSystemAdminOrSuperUser, IsSystemAdminOrSuperUserForSystem, filter_queryset_by_system_access


@extend_schema_view(
    list=extend_schema(tags=['System Roles'], summary="List user system roles", description="Retrieve a list of all user-system-role assignments accessible to the authenticated user"),
    create=extend_schema(tags=['System Roles'], summary="Assign role to user", description="Create a new user-system-role assignment with validation"),
    retrieve=extend_schema(tags=['System Roles'], summary="Get user system role details", description="Retrieve details of a specific user-system-role assignment"),
    update=extend_schema(tags=['System Roles'], summary="Update user system role", description="Update a user-system-role assignment (full update)"),
    partial_update=extend_schema(tags=['System Roles'], summary="Partially update user system role", description="Update specific fields of a user-system-role assignment"),
    destroy=extend_schema(tags=['System Roles'], summary="Remove role from user", description="Delete a user-system-role assignment")
)
class UserSystemRoleViewSet(viewsets.ModelViewSet):
    """
    ViewSet to manage User-System-Role assignments.
    Includes validation to ensure roles belong to the specified system.
    """
    queryset = UserSystemRole.objects.all()
    serializer_class = UserSystemRoleSerializer
    permission_classes = [IsSystemAdminOrSuperUser]

    def get_serializer_class(self):
        """
        Use different serializers for create/update vs list/retrieve operations.
        """
        if self.action in ['create', 'update', 'partial_update']:
            return CreateUserSystemRoleSerializer
        return UserSystemRoleSerializer

    def get_queryset(self):
        """Filter user system roles based on user permissions for all operations"""
        queryset = UserSystemRole.objects.all()
        return filter_queryset_by_system_access(queryset, self.request.user)

    def list(self, request):
        """List user system roles based on user permissions"""
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    def retrieve(self, request, pk=None):
        """Retrieve a user system role if user has access"""
        try:
            obj = self.get_queryset().get(pk=pk)
            serializer = self.get_serializer(obj)
            return Response(serializer.data)
        except UserSystemRole.DoesNotExist:
            return Response(
                {"error": "User system role not found or access denied"}, 
                status=status.HTTP_404_NOT_FOUND
            )

    def update(self, request, pk=None):
        """Update a user system role if user has access"""
        try:
            obj = self.get_queryset().get(pk=pk)
            
            # Check if user can modify assignments for this system
            if not request.user.is_superuser:
                system = obj.system
                if not UserSystemRole.objects.filter(
                    user=request.user,
                    system=system,
                    role__name='Admin'
                ).exists():
                    return Response(
                        {"error": "Access denied to modify this system's role assignments"}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            serializer = self.get_serializer(obj, data=request.data)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except UserSystemRole.DoesNotExist:
            return Response(
                {"error": "User system role not found or access denied"}, 
                status=status.HTTP_404_NOT_FOUND
            )

    def partial_update(self, request, pk=None):
        """Partial update a user system role if user has access"""
        try:
            obj = self.get_queryset().get(pk=pk)
            
            # Check if user can modify assignments for this system
            if not request.user.is_superuser:
                system = obj.system
                if not UserSystemRole.objects.filter(
                    user=request.user,
                    system=system,
                    role__name='Admin'
                ).exists():
                    return Response(
                        {"error": "Access denied to modify this system's role assignments"}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            serializer = self.get_serializer(obj, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except UserSystemRole.DoesNotExist:
            return Response(
                {"error": "User system role not found or access denied"}, 
                status=status.HTTP_404_NOT_FOUND
            )

    def destroy(self, request, pk=None):
        """Delete a user system role if user has access"""
        try:
            obj = self.get_queryset().get(pk=pk)
            
            # Prevent deletion of admin role assignments by non-superusers
            if not request.user.is_superuser and obj.role.name == 'Admin':
                return Response(
                    {"error": "Cannot remove Admin role assignments"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
            
            # Check if user can modify assignments for this system
            if not request.user.is_superuser:
                system = obj.system
                if not UserSystemRole.objects.filter(
                    user=request.user,
                    system=system,
                    role__name='Admin'
                ).exists():
                    return Response(
                        {"error": "Access denied to modify this system's role assignments"}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            obj.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except UserSystemRole.DoesNotExist:
            return Response(
                {"error": "User system role not found or access denied"}, 
                status=status.HTTP_404_NOT_FOUND
            )

    def create(self, request, *args, **kwargs):
        """Create user system role assignment with permission checks"""
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            # Check if user can assign roles for this system
            system = serializer.validated_data['system']
            if not request.user.is_superuser:
                if not UserSystemRole.objects.filter(
                    user=request.user,
                    system=system,
                    role__name='Admin'
                ).exists():
                    return Response(
                        {"error": "Access denied to this system"}, 
                        status=status.HTTP_403_FORBIDDEN
                    )
            
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @extend_schema(
        parameters=[
            OpenApiParameter(
                name='system_slug',
                description='System slug identifier',
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            )
        ],
        tags=['System Roles'],
        summary="Get system roles",
        description="Get all available roles for a specific system"
    )
    @action(detail=False, methods=['get'], url_path='system/(?P<system_slug>[^/.]+)/roles')
    def system_roles(self, request, system_slug=None):
        """
        Get all available roles for a specific system.
        GET /system-roles/system/{system_slug}/roles/
        """
        system = get_object_or_404(System, slug=system_slug)
        
        # Check permissions for this system
        if not request.user.is_superuser:
            if not UserSystemRole.objects.filter(
                user=request.user,
                system=system,
                role__name='Admin'
            ).exists():
                return Response(
                    {"error": "Access denied to this system"}, 
                    status=status.HTTP_403_FORBIDDEN
                )
        
        roles = Role.objects.filter(system=system)
        serializer = SystemRoleListSerializer(roles, many=True)
        
        return Response({
            "system": {
                "id": system.id,
                "name": system.name,
                "slug": system.slug
            },
            "roles_count": roles.count(),
            "roles": serializer.data
        }, status=status.HTTP_200_OK)


@extend_schema_view(
    create=extend_schema(tags=['System Roles'], summary="Invite user to system", description="Admin can invite a new user and assign them to a role in a system")
)
class AdminInviteUserViewSet(mixins.CreateModelMixin, viewsets.GenericViewSet):
    """
    ViewSet for inviting new users by admin.
    Accepts form-data or multipart and returns temp credentials and assignment info.
    """
    serializer_class = AdminInviteUserSerializer
    permission_classes = [IsSystemAdminOrSuperUser]
    parser_classes = [FormParser, MultiPartParser]  # Enables form-like POST (not just JSON)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # Get the role object from the serializer's validated data.
        # The serializer's `validate_role_id` returns a Role instance (or raises),
        # so prefer that instead of re-querying using the raw request value which
        # may contain tokens like 'admin_hdts'.
        role = serializer.validated_data.get('role_id')
        if not isinstance(role, Role):
            try:
                role = Role.objects.select_related('system').get(id=role)
            except Role.DoesNotExist:
                return Response(
                    {"error": "Invalid role specified"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Check if user can invite to this system
        if not request.user.is_superuser:
            if not UserSystemRole.objects.filter(
                user=request.user,
                system=role.system,
                role__name='Admin'
            ).exists():
                return Response(
                    {"error": "Access denied to this system"}, 
                    status=status.HTTP_403_FORBIDDEN
                )

        try:
            result = serializer.save()
            return Response({
                "user": result["user"].email,
                "temporary_password": result["temporary_password"],
                "role": result["assigned_role"].role.name,
                "system": result["assigned_role"].system.slug
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            # Avoid exposing sensitive internals but return useful message for debugging in dev
            import traceback
            traceback.print_exc()
            return Response({"error": str(e) or 'Internal error during invite'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@extend_schema_view(
    list=extend_schema(
        tags=['System Roles'], 
        summary="List users in system", 
        description="Get all users and their roles for a specific system by system slug",
        parameters=[
            OpenApiParameter(
                name='system_slug',
                description='System slug identifier',
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            )
        ]
    ),
    retrieve=extend_schema(
        tags=['System Roles'], 
        summary="Get user details in system", 
        description="Get details of a specific user's role assignment in a system",
        parameters=[
            OpenApiParameter(
                name='system_slug',
                description='System slug identifier',
                required=True,
                type=OpenApiTypes.STR,
                location=OpenApiParameter.PATH
            )
        ]
    )
)
class SystemUsersViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet to get all users of a specific system.
    Provides list and detail endpoints filtered by system.
    """
    serializer_class = SystemUsersSerializer
    permission_classes = [IsSystemAdminOrSuperUserForSystem]
    lookup_field = 'system__slug'  # Allow lookup by system slug
    lookup_url_kwarg = 'system_slug'

    def get_queryset(self):
        """
        Filter user system roles by system slug from URL parameter.
        """
        system_slug = self.kwargs.get('system_slug')
        if system_slug:
            return UserSystemRole.objects.filter(
                system__slug=system_slug
            ).select_related('user', 'role', 'system').order_by('user__email')
        return UserSystemRole.objects.none()

    def list(self, request, *args, **kwargs):
        """
        List all users for a specific system.
        """
        system_slug = kwargs.get('system_slug')
        if not system_slug:
            return Response(
                {"error": "System slug is required"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Verify system exists
        system = get_object_or_404(System, slug=system_slug)
        
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        
        return Response({
            "system": {
                "id": system.id,
                "name": system.name,
                "slug": system.slug
            },
            "users_count": queryset.count(),
            "users": serializer.data
        }, status=status.HTTP_200_OK)
