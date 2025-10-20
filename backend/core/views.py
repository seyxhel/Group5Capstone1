
from rest_framework.permissions import IsAuthenticated, BasePermission

# Move IsSystemAdmin definition to top
class IsSystemAdmin(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'role') and request.user.role == "System Admin"
from rest_framework.decorators import api_view, permission_classes, parser_classes

@api_view(['PATCH'])
@permission_classes([IsAuthenticated, IsSystemAdmin])
def deny_employee(request, pk):
    try:
        employee = Employee.objects.get(pk=pk)
    except Employee.DoesNotExist:
        return Response({'detail': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)
    if employee.status == 'Denied':
        return Response({'detail': 'Already denied.'}, status=status.HTTP_400_BAD_REQUEST)
    employee.status = 'Denied'
    employee.save()
    # Log rejection action
    try:
        from .models import EmployeeLog
        EmployeeLog.objects.create(employee=employee, action='rejected', performed_by=request.user, details='Account rejected by admin')
    except Exception:
        pass
    
    # Send rejection email (non-blocking). Uses unified sender (Gmail API when enabled).
    try:
        from .gmail_utils import send_email
        html = send_account_rejected_email(employee)
        result = send_email(
            to=employee.email,
            subject='Account Rejected',
            body=html,
            is_html=True,
            from_email=None
        )
        print(f"[deny_employee] send_email result: {result}")
    except Exception as e:
        print(f"[deny_employee] Email send failed: {e}")
    return Response({'detail': 'Employee denied.'}, status=status.HTTP_200_OK)
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, viewsets
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Employee, Ticket, TicketAttachment, TicketComment
from .models import PRIORITY_LEVELS, DEPARTMENT_CHOICES
from .serializers import EmployeeSerializer, TicketSerializer, TicketAttachmentSerializer, AdminTokenObtainPairSerializer, MyTokenObtainPairSerializer, CustomTokenObtainPairSerializer
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.utils import timezone
from django.http import JsonResponse, HttpResponse, Http404
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.permissions import IsAuthenticated, BasePermission
from django.shortcuts import get_object_or_404
import json
import os
from PIL import Image
from io import BytesIO
from django.core.files.base import ContentFile
from django.core.mail import send_mail
from rest_framework.reverse import reverse
from .tasks import push_ticket_to_workflow
from .models import EmployeeLog

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        email = data.get('email')
        password = data.get('password')

        user = authenticate(request, email=email, password=password)
        if user is not None:
            return JsonResponse({
                'success': True,
                'first_name': user.first_name,
                'message': 'Login successful'
            })
        else:
            return JsonResponse({'success': False, 'message': 'Invalid credentials'})

# For employee registration
class CreateEmployeeView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    def post(self, request, *args, **kwargs):
        data = request.data.copy()
        # If a multipart/form-data POST included an uploaded image, attach it
        # to the data dict so the serializer will receive the file under
        # the 'image' key and save it on the model.
        image_file = None
        try:
            image_file = request.FILES.get('image')
        except Exception:
            image_file = None
        if image_file:
            # request.data is a QueryDict; setting this key will allow the
            # ModelSerializer to pick up the file if it declares an ImageField
            data['image'] = image_file
        password = data.get("password")
        confirm_password = data.get("confirm_password")

        if password != confirm_password:
            return Response(
                {"error": "Passwords do not match."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = EmployeeSerializer(data=data)
        if serializer.is_valid():
            try:
                employee = serializer.save()
                # Create a log entry for account creation
                try:
                    EmployeeLog.objects.create(employee=employee, action='created', performed_by=request.user if hasattr(request, 'user') and request.user.is_authenticated else None, details='Account registered via public create endpoint')
                except Exception:
                    pass
                # Send pending-approval email to the registrant (non-blocking)
                try:
                    from .gmail_utils import send_email
                    # Build HTML from the template helper in this module
                    pending_html = send_account_pending_email(employee)
                    # Prefer DEFAULT_FROM_EMAIL if configured
                    try:
                        from django.conf import settings
                        from_email = getattr(settings, 'DEFAULT_FROM_EMAIL', None)
                    except Exception:
                        from_email = None
                    send_email(
                        to=employee.email,
                        subject='Account Creation Pending Approval',
                        body=pending_html,
                        is_html=True,
                        from_email=from_email or 'mapactivephsmartsupport@gmail.com'
                    )
                except Exception as e:
                    print(f"[CreateEmployeeView] pending email send failed: {e}")
                # Return serialized employee data so frontend can persist profile (image URL, names, etc.)
                serialized = EmployeeSerializer(employee).data
                return Response(
                    {"message": "Account created successfully. Pending approval.", "employee": serialized},
                    status=status.HTTP_201_CREATED
                )
            except Exception as e:
                return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class CreateAdminEmployeeView(APIView):
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def post(self, request, *args, **kwargs):
        print("[DEBUG] request.user:", request.user)
        print("[DEBUG] request.user.is_authenticated:", getattr(request.user, 'is_authenticated', None))
        print("[DEBUG] request.user.role:", getattr(request.user, 'role', None))
        print("[DEBUG] request.auth:", request.auth)
        data = request.data.copy()

        # Auto-generate Company ID (find lowest available MA number)
        existing_ids = Employee.objects.filter(company_id__startswith='MA').values_list('company_id', flat=True)
        used_numbers = set()
        for cid in existing_ids:
            try:
                used_numbers.add(int(cid[2:]))
            except Exception:
                pass
        # Find the lowest unused number
        new_num = 1
        while new_num in used_numbers:
            new_num += 1
        data['company_id'] = f"MA{new_num:04d}"

        # Set default password
        data['password'] = "1234"

        # Set status to Approved
        data['status'] = "Approved"

        # Remove image field if not present or empty, so model default is used
        if not data.get('image'):
            data.pop('image', None)

        serializer = EmployeeSerializer(data=data)
        if serializer.is_valid():
            employee = serializer.save()
            # Log admin-created and approved employee
            try:
                EmployeeLog.objects.create(employee=employee, action='created', performed_by=request.user, details='Account created by admin')
                EmployeeLog.objects.create(employee=employee, action='approved', performed_by=request.user, details='Account automatically approved by admin')
            except Exception:
                pass
            return Response({
                "message": "Employee account created and approved successfully",
                "company_id": employee.company_id
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ✅ Token view for employee login (only employees)
class EmployeeTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer  # restricts login to approved non-admin users

class AdminTokenObtainPairView(TokenObtainPairView):
    serializer_class = AdminTokenObtainPairSerializer

class TicketViewSet(viewsets.ModelViewSet):
    serializer_class = TicketSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser, MultiPartParser, FormParser]  # Accept JSON and form uploads
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['System Admin', 'Ticket Coordinator']:
            return Ticket.objects.all().order_by('-submit_date')  # Admins see all, newest first
        return Ticket.objects.filter(employee=user).order_by('-submit_date')  # Employees see their own, newest first
    
    def create(self, request, *args, **kwargs):
        # Extract the initial priority based on the category and subcategory
        # This logic would need to be updated based on your specific rules
        
        data = request.data.copy()
        # If frontend sent dynamic_data as a JSON string, parse it
        dynamic = data.get('dynamic_data')
        parsed_dynamic = None
        if dynamic:
            if isinstance(dynamic, (str, bytes)):
                try:
                    parsed_dynamic = json.loads(dynamic)
                except Exception:
                    parsed_dynamic = None
            elif isinstance(dynamic, dict):
                parsed_dynamic = dynamic

        # If parsed_dynamic is a dict, sanitize any date-like fields inside it
        # so values like "" or fancy quotes don't get sent later into model
        # fields that expect YYYY-MM-DD.
        if isinstance(parsed_dynamic, dict):
            dd = parsed_dynamic
            # map camelCase dynamic keys -> expected plain field names
            dynamic_date_keys = ['expectedReturnDate', 'performanceStartDate', 'performanceEndDate', 'scheduledDate']
            from datetime import datetime
            for dk in dynamic_date_keys:
                if dk in dd:
                    v = dd.get(dk)
                    if v is None:
                        continue
                    if not isinstance(v, str):
                        continue
                    s = v.strip()
                    if s == '' or all(c in '“”\"\'' for c in s):
                        dd[dk] = None
                        continue
                    if 'T' in s:
                        s = s.split('T')[0]
                    s = s.replace('/', '-')
                    try:
                        datetime.fromisoformat(s)
                        dd[dk] = s
                    except Exception:
                        dd[dk] = None

        # Convert request.data (QueryDict) to a plain dict so serializer sees proper types
        plain_data = {k: data.get(k) for k in data.keys()}
        if parsed_dynamic is not None:
            plain_data['dynamic_data'] = parsed_dynamic

        # Sanitize date fields coming from the frontend. The frontend may send
        # empty strings, fancy quote characters (e.g. “”), or ISO datetimes.
        # DRF's DateField will raise a ValidationError for invalid formats,
        # so convert anything that can't be parsed into None so the field
        # becomes null instead of causing a 500.
        date_keys = [
            'expected_return_date', 'performance_start_date',
            'performance_end_date', 'scheduled_date'
        ]
        from datetime import datetime
        for dk in date_keys:
            if dk in plain_data:
                val = plain_data.get(dk)
                if val is None:
                    continue
                # If it's already a date object, leave it
                # If it's a list/querydict value, convert to string
                if not isinstance(val, str):
                    # let the serializer handle non-string date objects
                    continue
                s = val.strip()
                # Treat empty or only-quote values as missing
                if s == '' or all(c in '“”\"\'' for c in s):
                    plain_data[dk] = None
                    continue
                # If it's an ISO datetime like 2023-01-01T12:00:00, take date part
                if 'T' in s:
                    s = s.split('T')[0]
                # Normalize common separators
                s = s.replace('/', '-')
                # Validate YYYY-MM-DD by attempting fromisoformat
                try:
                    # datetime.fromisoformat accepts YYYY-MM-DD
                    datetime.fromisoformat(s)
                    plain_data[dk] = s
                except Exception:
                    # If parsing fails, set to None to avoid raising a ValidationError
                    plain_data[dk] = None

        # Handle file uploads separately
        files = request.FILES.getlist('files[]')

        serializer = self.get_serializer(data=plain_data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        instance = self.perform_create(serializer)

        # Process multiple file attachments
        for file in files:
            TicketAttachment.objects.create(
                ticket=instance,
                file=file,
                file_name=file.name,
                file_type=file.content_type,
                file_size=file.size,
                uploaded_by=request.user
            )

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    def perform_create(self, serializer):
        return serializer.save()
        
    def perform_update(self, serializer):
        instance = serializer.instance
        if instance.status != serializer.validated_data.get('status'):
            # Status change logic
            new_status = serializer.validated_data.get('status')
            if new_status == 'Closed' and instance.status != 'Closed':
                serializer.validated_data['time_closed'] = timezone.now()
                if instance.submit_date:
                    serializer.validated_data['resolution_time'] = timezone.now() - instance.submit_date
        serializer.save()

def generate_company_id():
    last_employee = Employee.objects.filter(company_id__startswith='MA').order_by('company_id').last()
    if last_employee:
        last_num = int(last_employee.company_id[2:])
        new_num = last_num + 1
    else:
        new_num = 1
    return f"MA{new_num:04d}"

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_employee_admin_view(request):
    data = request.data.copy()
    data['company_id'] = generate_company_id()
    data['password'] = '1234'  # Default password
    data['status'] = 'Pending'

    # Remove 'image' from data — let model default take over
    data.pop('image', None)

    serializer = EmployeeSerializer(data=data)
    if serializer.is_valid():
        employee = serializer.save()
        return Response({
            'message': 'Account created successfully.',
            'company_id': employee.company_id
        }, status=status.HTTP_201_CREATED)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def employee_profile_view(request):
    """
    GET: return current user's profile
    PATCH: partially update current user's profile (multipart/form-data or JSON).
    Password updates should go through the change_password endpoint, but if a
    'password' field is included here we will set it securely.
    """
    user = request.user

    if request.method == 'GET':
        serializer = EmployeeSerializer(user)
        return Response(serializer.data)

    # PATCH - update fields
    data = request.data.copy()

    # Handle password separately to ensure proper hashing
    new_password = None
    if 'password' in data:
        new_password = data.pop('password')

    # If an uploaded image was sent, attach it so serializer will accept it
    try:
        image_file = request.FILES.get('image')
    except Exception:
        image_file = None
    if image_file:
        data['image'] = image_file

    serializer = EmployeeSerializer(user, data=data, partial=True)
    if serializer.is_valid():
        employee = serializer.save()
        if new_password:
            employee.set_password(new_password)
            employee.save()
        return Response(EmployeeSerializer(employee).data)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_ticket_detail(request, ticket_id):
    """
    Get detailed information about a specific ticket including employee data and comments
    """
    try:
        ticket = get_object_or_404(Ticket, id=ticket_id)
        
        # Check if user has permission to view this ticket
        if not (request.user.is_staff or request.user.role in ['System Admin', 'Ticket Coordinator'] or request.user == ticket.employee):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Get comments based on user role
        if request.user.role in ['System Admin', 'Ticket Coordinator'] or request.user.is_staff:
            # Admins can see all comments including internal ones
            comments = ticket.comments.all().order_by('-created_at')
        else:
            # Regular employees only see non-internal comments
            comments = ticket.comments.filter(is_internal=False).order_by('-created_at')
        
        # Serialize ticket data
        ticket_data = {
            'id': ticket.id,
            'ticket_number': ticket.ticket_number,
            'subject': ticket.subject,
            'category': ticket.category,
            'sub_category': ticket.sub_category,
            'description': ticket.description,
            'attachments': TicketAttachmentSerializer(ticket.attachments.all(), many=True).data,
            'status': ticket.status,
            'priority': ticket.priority,
            'department': ticket.department,
            'submit_date': ticket.submit_date,
            'update_date': ticket.update_date,
            'assigned_to': {
                'id': ticket.assigned_to.id,
                'first_name': ticket.assigned_to.first_name,
                'last_name': ticket.assigned_to.last_name,
            } if ticket.assigned_to else None,
            'employee': {
                'id': ticket.employee.id,
                'first_name': ticket.employee.first_name,
                'last_name': ticket.employee.last_name,
                'company_id': ticket.employee.company_id,
                'department': ticket.employee.department,
                'email': ticket.employee.email,
            },
            'comments': [
                {
                    'id': comment.id,
                    'comment': comment.comment,
                    'created_at': comment.created_at,
                    'is_internal': comment.is_internal,
                    'user': {
                        'id': comment.user.id,
                        'first_name': comment.user.first_name,
                        'last_name': comment.user.last_name,
                        'role': getattr(comment.user, 'role', 'User')
                    }
                } for comment in comments
            ]
        }
        
        return Response(ticket_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_ticket_by_number(request, ticket_number):
    """
    Lookup ticket by its ticket_number (string) and return the same payload as get_ticket_detail.
    """
    try:
        ticket = get_object_or_404(Ticket, ticket_number=ticket_number)

        # Check if user has permission to view this ticket
        if not (request.user.is_staff or request.user.role in ['System Admin', 'Ticket Coordinator'] or request.user == ticket.employee):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        # Get comments based on user role
        if request.user.role in ['System Admin', 'Ticket Coordinator'] or request.user.is_staff:
            comments = ticket.comments.all().order_by('-created_at')
        else:
            comments = ticket.comments.filter(is_internal=False).order_by('-created_at')

        ticket_data = {
            'id': ticket.id,
            'ticket_number': ticket.ticket_number,
            'subject': ticket.subject,
            'category': ticket.category,
            'sub_category': ticket.sub_category,
            'description': ticket.description,
            'attachments': TicketAttachmentSerializer(ticket.attachments.all(), many=True).data,
            'status': ticket.status,
            'priority': ticket.priority,
            'department': ticket.department,
            'submit_date': ticket.submit_date,
            'update_date': ticket.update_date,
            'assigned_to': {
                'id': ticket.assigned_to.id,
                'first_name': ticket.assigned_to.first_name,
                'last_name': ticket.assigned_to.last_name,
            } if ticket.assigned_to else None,
            'employee': {
                'id': ticket.employee.id,
                'first_name': ticket.employee.first_name,
                'last_name': ticket.employee.last_name,
                'company_id': ticket.employee.company_id,
                'department': ticket.employee.department,
                'email': ticket.employee.email,
            },
            'comments': [
                {
                    'id': comment.id,
                    'comment': comment.comment,
                    'created_at': comment.created_at,
                    'is_internal': comment.is_internal,
                    'user': {
                        'id': comment.user.id,
                        'first_name': comment.user.first_name,
                        'last_name': comment.user.last_name,
                        'role': getattr(comment.user, 'role', 'User')
                    }
                } for comment in comments
            ]
        }

        return Response(ticket_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_ticket_comment(request, ticket_id):
    """
    Add a comment to a ticket. Expects JSON { "comment": "...", "is_internal": false }
    """
    try:
        ticket = get_object_or_404(Ticket, id=ticket_id)

        # Permission: employee who owns the ticket or staff/admin/coordinator can comment
        if not (request.user.is_staff or request.user.role in ['System Admin', 'Ticket Coordinator'] or request.user == ticket.employee):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        comment_text = request.data.get('comment', '').strip()
        if not comment_text:
            return Response({'error': 'Comment text is required'}, status=status.HTTP_400_BAD_REQUEST)

        is_internal = bool(request.data.get('is_internal', False))
        # Prevent regular employees from creating internal comments
        if is_internal and not (request.user.is_staff or request.user.role in ['System Admin', 'Ticket Coordinator']):
            return Response({'error': 'Permission denied for internal comment'}, status=status.HTTP_403_FORBIDDEN)

        comment = TicketComment.objects.create(
            ticket=ticket,
            user=request.user,
            comment=comment_text,
            is_internal=is_internal
        )

        # Prepare serialized response similar to get_ticket_detail
        comment_data = {
            'id': comment.id,
            'comment': comment.comment,
            'created_at': comment.created_at,
            'is_internal': comment.is_internal,
            'user': {
                'id': comment.user.id,
                'first_name': comment.user.first_name,
                'last_name': comment.user.last_name,
                'role': getattr(comment.user, 'role', 'User')
            }
        }

        return Response(comment_data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def approve_ticket(request, ticket_id):
    try:
        ticket = get_object_or_404(Ticket, id=ticket_id)

        if not (request.user.is_staff or request.user.role in ['System Admin', 'Ticket Coordinator']):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        if ticket.status not in ['New', 'Pending']:
            return Response({'error': 'Ticket cannot be approved in current state'}, status=status.HTTP_400_BAD_REQUEST)

        priority = request.data.get('priority', 'Low')
        department = request.data.get('department', 'IT Department')
        approval_notes = request.data.get('approval_notes', '')

        valid_priorities = [choice[0] for choice in PRIORITY_LEVELS]
        valid_departments = [choice[0] for choice in DEPARTMENT_CHOICES]

        if priority not in valid_priorities:
            return Response({'error': 'Invalid priority level'}, status=status.HTTP_400_BAD_REQUEST)
        if department not in valid_departments:
            return Response({'error': 'Invalid department'}, status=status.HTTP_400_BAD_REQUEST)

        ticket.status = 'Open'
        ticket.priority = priority
        ticket.department = department
        # Leave ticket unassigned after approval; assignment should be a separate action
        ticket.save()

        # Create a visible comment with a consistent message for approval/open
        TicketComment.objects.create(
            ticket=ticket,
            user=request.user,
            comment="Status changed to Open",
            is_internal=False
        )

        return Response({
            'message': 'Ticket approved successfully',
            'ticket_id': ticket.id,
            'status': ticket.status,
            'priority': ticket.priority,
            'department': ticket.department
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_ticket(request, ticket_id):
    """
    Reject a ticket with a reason (only if status is 'New')
    """
    try:
        ticket = get_object_or_404(Ticket, id=ticket_id)
        
        # Check if user has permission to reject tickets
        if not (request.user.is_staff or request.user.role in ['System Admin', 'Ticket Coordinator']):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        # Only allow rejection if status is "New"
        if ticket.status != 'New':
            return Response({'error': "Only tickets with status 'New' can be rejected."}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get rejection reason from request
        rejection_reason = request.data.get('rejection_reason', '').strip()
        if not rejection_reason:
            return Response({'error': 'Rejection reason is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Update ticket
        ticket.status = 'Rejected'
        ticket.assigned_to = request.user  # Assign to the rejecting admin
        ticket.rejection_reason = rejection_reason  # Make sure this field exists in your model
        ticket.save()
        
        # Create internal comment for rejection
        TicketComment.objects.create(
            ticket=ticket,
            user=request.user,
            comment=f"Ticket rejected by {request.user.first_name} {request.user.last_name}. Reason: {rejection_reason}",
            is_internal=True
        )
        
        return Response({
            'message': 'Ticket rejected successfully',
            'ticket_id': ticket.id,
            'status': ticket.status,
            'rejection_reason': rejection_reason
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def claim_ticket(request, ticket_id):
    try:
        ticket = get_object_or_404(Ticket, id=ticket_id)

        # Only allow claiming if the ticket is Open
        if ticket.status != 'Open':
            return Response({'error': 'Ticket is not available for claiming.'}, status=status.HTTP_400_BAD_REQUEST)

        # Optional: prevent re-claim
        if ticket.assigned_to and ticket.status != 'Open':
            return Response({'error': 'Ticket is already claimed.'}, status=status.HTTP_400_BAD_REQUEST)

        # Mark ticket as in progress and assign to the claimant
        ticket.status = 'In Progress'
        ticket.assigned_to = request.user
        ticket.save()

        # Optional log entry
        # TicketComment.objects.create(
        #     ticket=ticket,
        #     user=request.user,
        #     comment="Ticket claimed and marked as In Progress",
        #     is_internal=True
        # )

        return Response({
            'message': 'Ticket successfully claimed.',
            'ticket_id': ticket.id,
            'status': ticket.status,
            'assigned_to': request.user.email
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def update_ticket_status(request, ticket_id):
    """
    Update ticket status with optional comment
    """
    try:
        ticket = get_object_or_404(Ticket, id=ticket_id)
        
        # Read requested status and comment first
        new_status = request.data.get('status')
        comment_text = request.data.get('comment', '').strip()

        # Check if user has permission to update tickets
        # Allow the ticket owner to close their own ticket (when new_status == 'Closed')
        if not (request.user.is_staff or request.user.role in ['System Admin', 'Ticket Coordinator']):
            if not (new_status == 'Closed' and ticket.employee == request.user):
                return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        if not new_status:
            return Response({'error': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate status transition
        valid_statuses = ['Open', 'In Progress', 'Resolved', 'Closed', 'On Hold', 'Rejected']
        if new_status not in valid_statuses:
            return Response({'error': 'Invalid status'}, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = ticket.status
        ticket.status = new_status
        
        # Handle special status changes
        if new_status == 'Closed' and old_status != 'Closed':
            ticket.time_closed = timezone.now()
            if ticket.submit_date:
                ticket.resolution_time = timezone.now() - ticket.submit_date
        
        ticket.save()
        
        # Create comment for status change
        if new_status == 'Rejected':
            status_comment = "Status changed to Rejected"
        else:
            status_comment = f"Status changed from '{old_status}' to '{new_status}' by {request.user.first_name} {request.user.last_name}"
            if comment_text:
                status_comment += f". Comment: {comment_text}"

        TicketComment.objects.create(
            ticket=ticket,
            user=request.user,
            comment=status_comment,
            is_internal=False  # Status updates can be visible to employees
        )
        
        return Response({
            'message': 'Ticket status updated successfully',
            'ticket_id': ticket.id,
            'old_status': old_status,
            'new_status': new_status
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def withdraw_ticket(request, ticket_id):
    """
    Allow employees to withdraw their own tickets
    """
    try:
        ticket = get_object_or_404(Ticket, id=ticket_id)
        
        # Check if user is the ticket owner
        if ticket.employee != request.user:
            return Response({'error': 'You can only withdraw your own tickets'}, status=status.HTTP_403_FORBIDDEN)
        
        # Check if ticket can be withdrawn (not already closed, withdrawn, or resolved)
        if ticket.status in ['Closed', 'Withdrawn', 'Resolved']:
            return Response({'error': f'Cannot withdraw ticket with status: {ticket.status}'}, status=status.HTTP_400_BAD_REQUEST)
        
        reason = request.data.get('reason', '').strip()
        if not reason:
            return Response({'error': 'Withdrawal reason is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        old_status = ticket.status
        ticket.status = 'Withdrawn'
        ticket.time_closed = timezone.now()
        if ticket.submit_date:
            ticket.resolution_time = timezone.now() - ticket.submit_date
        ticket.save()
        
        # Create comment for withdrawal
        withdrawal_comment = f"Ticket withdrawn by {request.user.first_name} {request.user.last_name}. Reason: {reason}"
        
        TicketComment.objects.create(
            ticket=ticket,
            user=request.user,
            comment=withdrawal_comment,
            is_internal=False
        )
        
        return Response({
            'message': 'Ticket withdrawn successfully',
            'ticket_id': ticket.id,
            'old_status': old_status,
            'new_status': 'Withdrawn'
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_new_tickets(request):
    """
    Get all tickets with 'New' status for admin review
    """
    try:
        # Check if user has permission to view tickets
        if not (request.user.is_staff or request.user.role in ['System Admin', 'Ticket Coordinator']):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        new_tickets = Ticket.objects.filter(status='New').select_related('employee').order_by('-submit_date')
        
        tickets_data = []
        for ticket in new_tickets:
            tickets_data.append({
                'id': ticket.id,
                'ticket_number': ticket.ticket_number,
                'subject': ticket.subject,
                'category': ticket.category,
                'submit_date': ticket.submit_date,
                'employee_name': f"{ticket.employee.first_name} {ticket.employee.last_name}",
                'employee_department': ticket.employee.department,
                'has_attachment': bool(ticket.attachments.exists())  # Updated to check TicketAttachment
            })
        
        return Response(tickets_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_open_tickets(request):
    try:
        if not request.user.is_staff and request.user.role not in ['System Admin', 'Ticket Coordinator']:
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)

        tickets = Ticket.objects.filter(status='Open').select_related('employee')
        data = TicketSerializer(tickets, many=True).data
        return Response(data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_tickets(request):
    """
    Get all tickets assigned to the current admin user
    """
    try:
        # Check if user has permission
        if not (request.user.is_staff or request.user.role in ['System Admin', 'Ticket Coordinator']):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        my_tickets = Ticket.objects.filter(assigned_to=request.user).select_related('employee').order_by('-submit_date')
        
        tickets_data = []
        for ticket in my_tickets:
            tickets_data.append({
                'id': ticket.id,
                'ticket_number': ticket.ticket_number,
                'subject': ticket.subject,
                'category': ticket.category,
                'priority': ticket.priority,
                'department': ticket.department,
                'status': ticket.status,
                'submit_date': ticket.submit_date,
                'update_date': ticket.update_date,
                'employee_name': f"{ticket.employee.first_name} {ticket.employee.last_name}",
                'employee_department': ticket.employee.department,
                'has_attachment': bool(ticket.attachments.exists())
            })
        
        return Response(tickets_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def download_attachment(request, ticket_id):
    """
    Secure file download endpoint
    """
    try:
        ticket = get_object_or_404(Ticket, id=ticket_id)
        
        # Check permissions
        if not (request.user.is_staff or request.user.role in ['System Admin', 'Ticket Coordinator'] or request.user == ticket.employee):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        if not ticket.attachment:
            raise Http404("File not found")
        
        file_path = ticket.attachment.path
        if os.path.exists(file_path):
            with open(file_path, 'rb') as fh:
                response = HttpResponse(fh.read(), content_type="application/octet-stream")
                response['Content-Disposition'] = f'attachment; filename="{os.path.basename(file_path)}"'
                return response
        else:
            raise Http404("File not found")
            
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
def custom_api_root(request, format=None):
    return Response({
        'create_employee': reverse('create_employee', request=request, format=format),
        'admin-create-employee': reverse('admin-create-employee', request=request, format=format),
        'token_employee': reverse('token_employee', request=request, format=format),
        'admin_token_obtain_pair': reverse('admin_token_obtain_pair', request=request, format=format),
        'token_refresh': reverse('token_refresh', request=request, format=format),
        'employee_profile': reverse('employee_profile', request=request, format=format),
        'get_ticket_detail': reverse('get_ticket_detail', args=[1], request=request, format=format),  # Example ID
        'approve_ticket': reverse('approve_ticket', args=[1], request=request, format=format),
        'reject_ticket': reverse('reject_ticket', args=[1], request=request, format=format),
        'claim_ticket': reverse('claim_ticket', args=[1], request=request, format=format),
        'update_ticket_status': reverse('update_ticket_status', args=[1], request=request, format=format),
        'get_new_tickets': reverse('get_new_tickets', request=request, format=format),
        'get_open_tickets': reverse('get_open_tickets', request=request, format=format),
        'get_my_tickets': reverse('get_my_tickets', request=request, format=format),
        'tickets': reverse('ticket-list', request=request, format=format),
    })

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password(request):
    user = request.user
    current_password = request.data.get('current_password')
    new_password = request.data.get('new_password')

    if not current_password or not new_password:
        return Response({'detail': 'Current and new password are required.'}, status=status.HTTP_400_BAD_REQUEST)

    if not user.check_password(current_password):
        return Response({'detail': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

    if len(new_password) < 8:
        return Response({'detail': 'New password must be at least 8 characters.'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    return Response({'detail': 'Password changed successfully.'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser])
def upload_profile_image(request):
    user = request.user
    print(f"Upload request from user: {user.email} (ID: {user.id})")
    
    image_file = request.FILES.get('image')
    if not image_file:
        print("No image file in request.FILES")
        return Response({'detail': 'No image provided.'}, status=status.HTTP_400_BAD_REQUEST)

    print(f"Received image: {image_file.name}, size: {image_file.size}, type: {image_file.content_type}")

    # Validate file type
    if not image_file.content_type in ['image/png', 'image/jpeg', 'image/jpg']:
        return Response({'detail': 'Invalid file type.'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate file size (max 2MB)
    if image_file.size > 2 * 1024 * 1024:
        return Response({'detail': 'File size exceeds 2MB.'}, status=status.HTTP_400_BAD_REQUEST)

    # Delete old image if it exists and is not the default
    if user.image and not user.image.name.endswith('default-profile.png'):
        old_image_path = user.image.path
        if os.path.exists(old_image_path):
            try:
                os.remove(old_image_path)
                print(f"Deleted old image: {old_image_path}")
            except Exception as e:
                print(f"Could not delete old image: {e}")

    # Resize image to 1024x1024
    try:
        img = Image.open(image_file)
        img = img.convert('RGB')
        img = img.resize((1024, 1024))
        buffer = BytesIO()
        img.save(buffer, format='JPEG')
        file_content = ContentFile(buffer.getvalue())
        
        # Save with a consistent filename to avoid duplicates
        filename = f"profile_{user.id}.jpg"
        user.image.save(filename, file_content, save=True)
        
        print(f"Image saved successfully to: {user.image.url}")
        
        return Response({
            'detail': 'Image uploaded successfully.',
            'image_url': user.image.url
        })
    except Exception as e:
        print(f"Error processing image: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({'detail': f'Failed to process image: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def verify_password(request):
    """Verify that the provided current_password matches the authenticated user."""
    current_password = request.data.get('current_password')
    if not current_password:
        return Response({'detail': 'Current password required.'}, status=status.HTTP_400_BAD_REQUEST)
    user = request.user
    if user.check_password(current_password):
        return Response({'detail': 'Password verified.'})
    return Response({'detail': 'Incorrect password.'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_employees(request):
    # Allow system admins, ticket coordinators, or staff to view all employees
    if not request.user.is_staff and request.user.role not in ['System Admin', 'Ticket Coordinator']:
        return Response({'detail': 'Permission denied.'}, status=403)
    employees = Employee.objects.all()
    serializer = EmployeeSerializer(employees, many=True)
    return Response(serializer.data)

class IsSystemAdmin(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, 'role') and request.user.role == "System Admin"

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSystemAdmin])
def approve_employee(request, pk):
    try:
        employee = Employee.objects.get(pk=pk)
    except Employee.DoesNotExist:
        return Response({'detail': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)
    if employee.status == 'Approved':
        return Response({'detail': 'Already approved.'}, status=status.HTTP_400_BAD_REQUEST)
    employee.status = 'Approved'
    employee.save()

    # Log approval action
    try:
        EmployeeLog.objects.create(employee=employee, action='approved', performed_by=request.user, details='Account approved by admin')
    except Exception:
        pass

    # Send approval email using the unified email sender. This will use the
    # Gmail API if EMAIL_USE_GMAIL_API env var is true (default), otherwise
    # will fall back to Django's SMTP send_mail.
    try:
        from .gmail_utils import send_email
        html = send_account_approved_email(employee)
        result = send_email(
            to=employee.email,
            subject='Your Account is Ready!',
            body=html,
            is_html=True,
            from_email='sethpelagio20@gmail.com'
        )
        print(f"[approve_employee] send_email result: {result}")
    except Exception as e:
        # Log but don't fail approval
        print(f"[approve_employee] Email send failed: {e}")

    return Response({'detail': 'Employee approved and email sent.'}, status=status.HTTP_200_OK)

class ApproveEmployeeView(APIView):
    def post(self, request):
        email = request.data.get('email')
        try:
            employee = Employee.objects.get(email=email)
            employee.status = 'Approved'
            employee.save()
            return Response({'message': 'Employee approved.'}, status=status.HTTP_200_OK)
        except Employee.DoesNotExist:
            return Response({'error': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)


def send_account_approved_email(employee):
        logo_url = "https://smartsupport-hdts-frontend.up.railway.app/MapLogo.png"
        site_url = "https://smartsupport-hdts-frontend.up.railway.app/"
        html_content = f"""
        <html>
            <body style="background:#f6f8fa;padding:32px 0;">
                <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:10px;box-shadow:0 2px 8px #0001;overflow:hidden;border:1px solid #e0e0e0;">
                    <div style="padding:40px 32px 32px 32px;text-align:center;">
                        <img src="{logo_url}" alt="SmartSupport Logo" style="width:90px;margin-bottom:24px;display:block;margin-left:auto;margin-right:auto;" />
                        <div style="font-size:1.6rem;margin-bottom:28px;margin-top:8px;font-family:Verdana, Geneva, sans-serif;">
                            Account Approved!
                        </div>
                        <div style="text-align:left;margin:0 auto 24px auto;">
                            <p style="font-size:16px;color:#222;margin:0 0 14px 0;font-family:Verdana, Geneva, sans-serif;">
                                Hi {employee.first_name},
                            </p>
                            <p style="font-size:16px;color:#222;margin:0 0 14px 0;font-family:Verdana, Geneva, sans-serif;">
                                Your account has been approved! You can now log in using the credentials you signed up with.
                            </p>
                            <p style="font-size:15px;color:#444;margin-bottom:14px;font-family:Verdana, Geneva, sans-serif;">
                                If you need help, contact us at:<br>
                                <a href="mailto:mapactivephsmartsupport@gmail.com" style="color:#2563eb;text-decoration:none;font-family:Verdana, Geneva, sans-serif;">mapactivephsmartsupport@gmail.com</a>
                            </p>
                            <p style="font-size:15px;color:#444;margin-bottom:18px;font-family:Verdana, Geneva, sans-serif;">
                                Best regards,<br>
                                MAP Active PH SmartSupport
                            </p>
                        </div>
                        <a href="{site_url}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 32px;border-radius:6px;font-weight:600;font-size:16px;font-family:Verdana, Geneva, sans-serif;margin-bottom:24px;">
                            Visit site
                        </a>
                        <div style="margin-top:18px;text-align:left;">
                            <span style="font-size:1.5rem;font-weight:bold;color:#3b82f6;font-family:Verdana, Geneva, sans-serif;letter-spacing:1px;">
                                SmartSupport
                            </span>
                        </div>
                    </div>
                    <div style="height:5px;background:#2563eb;"></div>
                </div>
            </body>
        </html>
        """
        return html_content


def send_account_rejected_email(employee):
        logo_url = "https://smartsupport-hdts-frontend.up.railway.app/MapLogo.png"
        site_url = "https://smartsupport-hdts-frontend.up.railway.app/"
        html_content = f"""
        <html>
            <body style="background:#f6f8fa;padding:32px 0;">
                <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:10px;box-shadow:0 2px 8px #0001;overflow:hidden;border:1px solid #e0e0e0;">
                    <div style="padding:40px 32px 32px 32px;text-align:center;">
                        <img src="{logo_url}" alt="SmartSupport Logo" style="width:90px;margin-bottom:24px;display:block;margin-left:auto;margin-right:auto;" />
                        <div style="font-size:1.6rem;margin-bottom:28px;margin-top:8px;font-family:Verdana, Geneva, sans-serif;">
                            Account Rejected
                        </div>
                        <div style="text-align:left;margin:0 auto 24px auto;">
                            <p style="font-size:16px;color:#222;margin:0 0 14px 0;font-family:Verdana, Geneva, sans-serif;">
                                Hi {employee.first_name},
                            </p>
                            <p style="font-size:16px;color:#222;margin:0 0 14px 0;font-family:Verdana, Geneva, sans-serif;">
                                We couldn’t create your account. Please double-check the information you’ve entered to ensure everything is correct. If you'd like, feel free to try creating your account again.
                            </p>
                            <p style="font-size:15px;color:#444;margin-bottom:14px;font-family:Verdana, Geneva, sans-serif;">
                                If you need help, contact us at:<br>
                                <a href="mailto:mapactivephsmartsupport@gmail.com" style="color:#2563eb;text-decoration:none;font-family:Verdana, Geneva, sans-serif;">mapactivephsmartsupport@gmail.com</a>
                            </p>
                            <p style="font-size:15px;color:#444;margin-bottom:18px;font-family:Verdana, Geneva, sans-serif;">
                                Best regards,<br>
                                MAP Active PH SmartSupport
                            </p>
                        </div>
                        <a href="{site_url}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 32px;border-radius:6px;font-weight:600;font-size:16px;font-family:Verdana, Geneva, sans-serif;margin-bottom:24px;">
                            Visit site
                        </a>
                        <div style="margin-top:18px;text-align:left;">
                            <span style="font-size:1.5rem;font-weight:bold;color:#3b82f6;font-family:Verdana, Geneva, sans-serif;letter-spacing:1px;">
                                SmartSupport
                            </span>
                        </div>
                    </div>
                    <div style="height:5px;background:#2563eb;"></div>
                </div>
            </body>
        </html>
        """
        return html_content


def send_account_pending_email(employee):
        logo_url = "https://smartsupport-hdts-frontend.up.railway.app/MapLogo.png"
        site_url = "https://smartsupport-hdts-frontend.up.railway.app/"
        html_content = f"""
        <html>
            <body style="background:#f6f8fa;padding:32px 0;">
                <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:10px;box-shadow:0 2px 8px #0001;overflow:hidden;border:1px solid #e0e0e0;">
                    <div style="padding:40px 32px 32px 32px;text-align:center;">
                        <img src="{logo_url}" alt="SmartSupport Logo" style="width:90px;margin-bottom:24px;display:block;margin-left:auto;margin-right:auto;" />
                        <div style="font-size:1.6rem;margin-bottom:28px;margin-top:8px;font-family:Verdana, Geneva, sans-serif;">
                            Account Creation Pending Approval
                        </div>
                        <div style="text-align:left;margin:0 auto 24px auto;">
                            <p style="font-size:16px;color:#222;margin:0 0 14px 0;font-family:Verdana, Geneva, sans-serif;">
                                Hi {employee.first_name},
                            </p>
                            <p style="font-size:16px;color:#222;margin:0 0 14px 0;font-family:Verdana, Geneva, sans-serif;">
                                Thank you for signing up with MAP Active PH! Your account has been successfully created, but it is currently awaiting approval. You’ll receive a confirmation email once your account has been approved.
                            </p>
                            <p style="font-size:15px;color:#444;margin-bottom:14px;font-family:Verdana, Geneva, sans-serif;">
                                If you have any questions, don’t hesitate to reach out to us.
                            </p>
                            <p style="font-size:15px;color:#444;margin-bottom:14px;font-family:Verdana, Geneva, sans-serif;">
                                If you did not create this account, please contact us immediately at: <a href="mailto:mapactivephsmartsupport@gmail.com" style="color:#2563eb;text-decoration:none;">mapactivephsmartsupport@gmail.com</a>
                            </p>
                            <p style="font-size:15px;color:#444;margin-bottom:18px;font-family:Verdana, Geneva, sans-serif;">
                                Best regards,<br>
                                MAP Active PH SmartSupport
                            </p>
                        </div>
                        <a href="{site_url}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 32px;border-radius:6px;font-weight:600;font-size:16px;font-family:Verdana, Geneva, sans-serif;margin-bottom:24px;">
                            Visit site
                        </a>
                        <div style="margin-top:18px;text-align:left;">
                            <span style="font-size:1.5rem;font-weight:bold;color:#3b82f6;font-family:Verdana, Geneva, sans-serif;letter-spacing:1px;">
                                SmartSupport
                            </span>
                        </div>
                    </div>
                    <div style="height:5px;background:#2563eb;"></div>
                </div>
            </body>
        </html>
        """
        return html_content


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def finalize_ticket(request, ticket_id):
    try:
        ticket = Ticket.objects.get(pk=ticket_id)
        print("Finalize called for ticket:", ticket_id)
        print("Attachments:", list(ticket.attachments.all()))
        data = TicketSerializer(ticket).data
        return Response({'detail': 'Ticket finalized and sent to workflow.'})
    except Ticket.DoesNotExist:
        return Response({'detail': 'Ticket not found.'}, status=404)


# Knowledge Article ViewSet
from rest_framework.decorators import action
from rest_framework.permissions import SAFE_METHODS, AllowAny
from .serializers import KnowledgeArticleSerializer
from .models import KnowledgeArticle


class KnowledgeArticleViewSet(viewsets.ModelViewSet):
    serializer_class = KnowledgeArticleSerializer
    # default permission for unsafe methods; we'll override for safe methods in get_permissions
    permission_classes = [IsAuthenticated, IsSystemAdmin]

    def get_permissions(self):
        """Allow safe (read-only) methods to be accessible without System Admin permission.
        Unsafe methods (create/update/delete) still require IsAuthenticated and IsSystemAdmin.
        """
        # If it's a safe method, allow public read access.
        if self.request.method in SAFE_METHODS:
            return [AllowAny()]
        return [perm() for perm in self.permission_classes]

    # Use default list/retrieve implementations from ModelViewSet (no debug prints)

    def get_queryset(self):
        """Return all articles for listing; filtering happens in the view layer"""
        return KnowledgeArticle.objects.all().order_by('-created_at')

    def perform_create(self, serializer):
        """Set the created_by field to the current user"""
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'], url_path='archive')
    def archive(self, request, pk=None):
        """Archive an article"""
        article = self.get_object()
        article.is_archived = True
        article.save()
        return Response({'detail': 'Article archived successfully.'}, status=status.HTTP_200_OK)
    
    @action(detail=True, methods=['post'], url_path='restore')
    def restore(self, request, pk=None):
        """Restore an archived article"""
        article = self.get_object()
        article.is_archived = False
        article.save()
        return Response({'detail': 'Article restored successfully.'}, status=status.HTTP_200_OK)
