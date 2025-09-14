from rest_framework import serializers
from .models import Employee, Ticket, TicketAttachment
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import AuthenticationFailed
from django.conf import settings
from .media_utils import get_media_url_with_token, generate_secure_media_url

class EmployeeSerializer(serializers.ModelSerializer):
    # Use ImageField for input/output, override in to_representation for secure URLs
    image = serializers.ImageField(required=False, allow_null=True)
    
    class Meta:
        model = Employee
        fields = [
            'id',  # <-- Add this line
            'last_name', 'first_name', 'middle_name', 'suffix',
            'company_id', 'department', 'email', 'password', 
            'image', 'role', 'status', 'date_created'
        ]
        extra_kwargs = {
            'password': {'write_only': True},
        }

    def to_representation(self, instance):
        """Override to return secure URLs for image field"""
        data = super().to_representation(instance)
        request = self.context.get('request')
        
        if request and request.user.is_authenticated:
            if instance.image:
                # Try to get secure URL for user's image (custom or default)
                try:
                    data['image'] = get_media_url_with_token(instance.image, request.user)
                except Exception:
                    # If there's an issue with the user's image, fallback to default
                    data['image'] = generate_secure_media_url('employee_images/default-profile.png', request.user)
            else:
                # No image field, use default
                data['image'] = generate_secure_media_url('employee_images/default-profile.png', request.user)
        else:
            data['image'] = None
            
        return data

    def create(self, validated_data):
        password = validated_data.pop('password')
        employee = Employee(**validated_data)
        employee.set_password(password)
        employee.save()
        return employee

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['email'] = user.email
        token['role'] = user.role
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        
        return token

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        try:
            data = super().validate(attrs)
        except AuthenticationFailed:
            raise serializers.ValidationError("Invalid credentials.")

        user = self.user

        if user.is_superuser or user.role in ["System Admin", "Ticket Coordinator"]:
            raise serializers.ValidationError("Invalid credentials.")

        if hasattr(user, 'status') and user.status != 'Approved':
            raise serializers.ValidationError("Account is pending for approval.")

        data['email'] = user.email
        data['role'] = user.role if hasattr(user, 'role') else 'Unknown'
        data['first_name'] = user.first_name
        data['last_name'] = user.last_name
        data['dateCreated'] = user.date_created
        # Return secure image URL instead of relative path
        data['image'] = get_media_url_with_token(user.image, user) if user.image else ""

        return data

class AdminTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        user = self.user

        if not user.is_superuser and user.role not in ["System Admin", "Ticket Coordinator"]:
            raise serializers.ValidationError("Invalid credentials.")

        # Add these to the response body (optional)
        data['email'] = user.email
        data['role'] = getattr(user, 'role', 'Unknown')
        data['first_name'] = user.first_name

        return data

    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # ✅ Add custom claims to the JWT
        token['email'] = user.email
        token['role'] = user.role
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name

        return token

class TicketAttachmentSerializer(serializers.ModelSerializer):
    file = serializers.SerializerMethodField()

    class Meta:
        model = TicketAttachment
        fields = ['id', 'file', 'file_name', 'file_type', 'file_size', 'upload_date']
        read_only_fields = ['id', 'upload_date', 'file_size']

    def get_file(self, obj):
        request = self.context.get('request')
        if obj.file and request and request.user.is_authenticated:
            # Return secure URL with token
            return get_media_url_with_token(obj.file, request.user)
        return None

class EmployeeInfoSerializer(serializers.ModelSerializer):
    image = serializers.SerializerMethodField()
    
    class Meta:
        model = Employee
        fields = ['first_name', 'last_name', 'email', 'company_id', 'department', 'image']
    
    def get_image(self, obj):
        request = self.context.get('request')
        if obj.image and request and request.user.is_authenticated:
            # Return secure URL with token
            return get_media_url_with_token(obj.image, request.user)
        return None

class TicketSerializer(serializers.ModelSerializer):
    attachments = TicketAttachmentSerializer(many=True, read_only=True)
    scheduled_date = serializers.DateField(required=False, allow_null=True)
    assigned_to = serializers.StringRelatedField(read_only=True)
    employee = EmployeeInfoSerializer(read_only=True)

    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_number', 'subject', 'category', 'sub_category',
            'description', 'scheduled_date', 'priority', 'department',
            'status', 'submit_date', 'update_date', 'assigned_to', 'attachments',
            'employee'
        ]
        read_only_fields = [
            'id', 'ticket_number', 'submit_date', 'update_date',
            'response_time', 'resolution_time', 'time_closed', 'assigned_to',
            'employee'
        ]

    def create(self, validated_data):
        user = self.context['request'].user
        return Ticket.objects.create(employee=user, **validated_data)
    
def ticket_to_dict(ticket, user=None):
    # Gather all attachments for this ticket
    attachments = []
    for att in TicketAttachment.objects.filter(ticket=ticket):
        attachment_data = {
            "id": att.id,
            "file": None,
            "file_name": att.file_name,
            "file_type": att.file_type,
            "file_size": att.file_size,
            "upload_date": att.upload_date.isoformat() if att.upload_date else None,
        }
        
        # Generate secure URL if user is provided
        if user and att.file:
            attachment_data["file"] = get_media_url_with_token(att.file, user)
        elif att.file:
            attachment_data["file"] = att.file.url
            
        attachments.append(attachment_data)

    # Gather customer (employee) info
    employee = ticket.employee
    customer = None
    if employee:
        customer = {
            "id": employee.id,
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "middle_name": employee.middle_name,
            "suffix": employee.suffix,
            "email": employee.email,
            "company_id": employee.company_id,
            "department": employee.department,
            "image": None,
        }
        
        # Generate secure URL for employee image if user is provided
        if user and employee.image:
            customer["image"] = get_media_url_with_token(employee.image, user)
        elif employee.image:
            customer["image"] = employee.image.url


def ticket_to_dict_for_external_systems(ticket):
    """
    Convert ticket to dictionary for external systems (like workflow API)
    Uses URLs with API key for external system access
    """
    from django.conf import settings
    
    # Get external system API key from settings
    api_key = getattr(settings, 'EXTERNAL_SYSTEM_API_KEY', 'external-api-key-placeholder')
    
    # Gather all attachments for this ticket with API key URLs
    attachments = []
    for att in TicketAttachment.objects.filter(ticket=ticket):
        attachment_data = {
            "id": att.id,
            "file": None,
            "file_name": att.file_name,
            "file_type": att.file_type,
            "file_size": att.file_size,
            "upload_date": att.upload_date.isoformat() if att.upload_date else None,
        }
        
        # Use URL with API key for external systems
        if att.file:
            # Build URL with API key for external system access
            attachment_data["file"] = f"https://smartsupport-hdts-backend.up.railway.app{att.file.url}?api_key={api_key}"
            
        attachments.append(attachment_data)

    # Gather customer (employee) info with API key URLs
    employee = ticket.employee
    customer = None
    if employee:
        customer = {
            "id": employee.id,
            "first_name": employee.first_name,
            "last_name": employee.last_name,
            "middle_name": employee.middle_name,
            "suffix": employee.suffix,
            "email": employee.email,
            "company_id": employee.company_id,
            "department": employee.department,
            "image": None,
        }
        
        # Use URL with API key for employee image
        if employee.image:
            customer["image"] = f"https://smartsupport-hdts-backend.up.railway.app{employee.image.url}?api_key={api_key}"

    data = {
        "id": ticket.id,
        "ticket_id": ticket.ticket_number,
        "subject": ticket.subject,
        "category": ticket.category,
        "subcategory": ticket.sub_category,
        "description": ticket.description,
        "scheduled_date": ticket.scheduled_date.isoformat() if ticket.scheduled_date else None,
        "priority": ticket.priority,
        "department": ticket.department,
        "status": ticket.status,
        "submit_date": ticket.submit_date.isoformat() if ticket.submit_date else None,
        "update_date": ticket.update_date.isoformat() if ticket.update_date else None,
        "assigned_to": str(ticket.assigned_to) if ticket.assigned_to else None,
        "customer": customer,
        "attachments": attachments,
        "response_time": str(ticket.response_time) if hasattr(ticket, "response_time") and ticket.response_time else None,
        "resolution_time": str(ticket.resolution_time) if hasattr(ticket, "resolution_time") and ticket.resolution_time else None,
        "time_closed": ticket.time_closed.isoformat() if hasattr(ticket, "time_closed") and ticket.time_closed else None,
        "rejection_reason": ticket.rejection_reason if hasattr(ticket, "rejection_reason") else None,
    }

    print("Serialized ticket data for external systems:", data)

    return data


def ticket_to_dict(ticket, user=None):
    """
    Convert ticket to dictionary for internal use (with secure URLs when user provided)
    """
    # Call external systems function and then modify for internal use if user provided
    data = ticket_to_dict_for_external_systems(ticket)
    
    if user:
        # Replace public URLs with secure ones for internal use
        for attachment in data["attachments"]:
            if attachment["file"]:
                try:
                    att = TicketAttachment.objects.get(id=attachment["id"])
                    if att.file:
                        attachment["file"] = get_media_url_with_token(att.file, user)
                except TicketAttachment.DoesNotExist:
                    pass
        
        # Replace employee image URL with secure one
        if data["customer"] and data["customer"]["image"]:
            try:
                employee = ticket.employee
                if employee and employee.image:
                    data["customer"]["image"] = get_media_url_with_token(employee.image, user)
            except:
                pass
    
    return data
