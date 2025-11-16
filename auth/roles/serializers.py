from rest_framework import serializers
from .models import *
from systems.models import System

class RegisterSerializer(serializers.ModelSerializer):
    system = serializers.PrimaryKeyRelatedField(queryset=System.objects.all())
    system_name = serializers.CharField(source='system.name', read_only=True)
    
    class Meta:
        model = Role
        fields = ('id','system', 'name', 'description', 'created_at', 'system_name')

class SystemRolesSerializer(serializers.ModelSerializer):
    system = serializers.PrimaryKeyRelatedField(queryset=System.objects.all())
    system_name = serializers.CharField(source='system.name', read_only=True)
    
    class Meta:
        model = Role
        fields = '__all__'
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            # Filter systems based on user's access
            if request.user.is_superuser:
                # Superuser can see all systems
                systems_queryset = System.objects.all()
            else:
                # Regular users can only see systems they have access to
                from system_roles.models import UserSystemRole
                user_systems = UserSystemRole.objects.filter(
                    user=request.user
                ).values_list('system', flat=True)
                systems_queryset = System.objects.filter(id__in=user_systems)
            
            self.fields['system'].queryset = systems_queryset
        else:
            # For unauthenticated users or schema generation, show all systems
            self.fields['system'].queryset = System.objects.all()
        
    def to_representation(self, instance):
        """Add system name for better readability in responses"""
        representation = super().to_representation(instance)
        return representation