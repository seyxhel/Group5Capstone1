from rest_framework import serializers
from .models import Employee, Ticket, TicketAttachment
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import AuthenticationFailed

class EmployeeSerializer(serializers.ModelSerializer):
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
            'image': {'required': False, 'allow_null': True}
        }

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
        data['dateCreated'] = user.date_created

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
    class Meta:
        model = TicketAttachment
        fields = ['id', 'file', 'file_name', 'file_type', 'file_size', 'upload_date']
        read_only_fields = ['id', 'upload_date', 'file_size']

class EmployeeInfoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['first_name', 'last_name', 'email', 'company_id', 'department', 'image']

class TicketSerializer(serializers.ModelSerializer):
    attachments = TicketAttachmentSerializer(many=True, read_only=True)
    scheduled_date = serializers.DateField(required=False, allow_null=True)
    assigned_to = serializers.StringRelatedField(read_only=True)
    employee = EmployeeInfoSerializer(read_only=True)
    # Allow arbitrary JSON from the frontend
    dynamic_data = serializers.JSONField(required=False, allow_null=True)
    asset_name = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    serial_number = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    location = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    expected_return_date = serializers.DateField(required=False, allow_null=True)
    issue_type = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    other_issue = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    performance_start_date = serializers.DateField(required=False, allow_null=True)
    performance_end_date = serializers.DateField(required=False, allow_null=True)
    approved_by = serializers.CharField(required=False, allow_blank=True, allow_null=True)
    cost_items = serializers.JSONField(required=False, allow_null=True)
    requested_budget = serializers.DecimalField(required=False, allow_null=True, max_digits=12, decimal_places=2)

    class Meta:
        model = Ticket
        fields = [
            'id', 'ticket_number', 'subject', 'category', 'sub_category',
            'description', 'scheduled_date', 'priority', 'department',
                'asset_name', 'serial_number', 'location', 'expected_return_date',
                'issue_type', 'other_issue', 'performance_start_date', 'performance_end_date',
                'approved_by', 'cost_items', 'requested_budget', 'dynamic_data',
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
        # Pop dynamic_data if present and pass to model
        dynamic = validated_data.pop('dynamic_data', None)

        # Map commonly used dynamic fields into explicit model fields if present
        if dynamic and isinstance(dynamic, dict):
            for key, field in [
                ('assetName', 'asset_name'),
                ('serialNumber', 'serial_number'),
                ('location', 'location'),
                ('expectedReturnDate', 'expected_return_date'),
                ('issueType', 'issue_type'),
                ('otherIssue', 'other_issue'),
                ('performanceStartDate', 'performance_start_date'),
                ('performanceEndDate', 'performance_end_date'),
                ('approvedBy', 'approved_by'),
                ('costItems', 'cost_items'),
                ('requestedBudget', 'requested_budget')
            ]:
                if key in dynamic and dynamic[key] is not None:
                    validated_data[field] = dynamic[key]

        ticket = Ticket.objects.create(employee=user, dynamic_data=dynamic, **validated_data)
        return ticket
    
def ticket_to_dict(ticket):
    # Gather all attachments for this ticket
    attachments = [
        {
            "id": att.id,
            "file": att.file.url if att.file else None,
            "file_name": att.file_name,
            "file_type": att.file_type,
            "file_size": att.file_size,
            "upload_date": att.upload_date.isoformat() if att.upload_date else None,
        }
        for att in TicketAttachment.objects.filter(ticket=ticket)
    ]

    # Gather customer (employee) info
    employee = ticket.employee
    customer = {
        "id": employee.id,
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "middle_name": employee.middle_name,
        "suffix": employee.suffix,
        "email": employee.email,
        "company_id": employee.company_id,
        "department": employee.department,
        "image": employee.image.url if employee.image else None,
    } if employee else None

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

    print("Serialized ticket data:", data)  # <-- Debug print statement

    return data
