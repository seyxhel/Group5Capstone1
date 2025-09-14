from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status, permissions, viewsets
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import Employee, Ticket, TicketAttachment, TicketComment
from .models import PRIORITY_LEVELS, DEPARTMENT_CHOICES
from .serializers import EmployeeSerializer, TicketSerializer, TicketAttachmentSerializer, AdminTokenObtainPairSerializer, MyTokenObtainPairSerializer, CustomTokenObtainPairSerializer
from rest_framework.parsers import MultiPartParser, FormParser
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
from django.core.mail import send_mail, EmailMultiAlternatives
from rest_framework.reverse import reverse
from .tasks import push_ticket_to_workflow
from django.contrib.auth.tokens import default_token_generator
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.utils.encoding import force_bytes
from django.conf import settings

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

@csrf_exempt
def test_endpoint(request):
    """Simple test endpoint to verify backend is working"""
    return JsonResponse({
        'status': 'success',
        'message': 'Backend is working correctly',
        'method': request.method,
        'email_configured': bool(settings.EMAIL_HOST_USER and settings.EMAIL_HOST_PASSWORD)
    })

# For employee registration
class CreateEmployeeView(APIView):
    parser_classes = [MultiPartParser, FormParser]  # Add this to handle file uploads
    
    def post(self, request, *args, **kwargs):
        try:
            print("=== CreateEmployeeView: POST request received ===")
            print(f"Request data keys: {list(request.data.keys())}")
            print(f"Request content type: {request.content_type}")
            
            # Wrap everything in try-catch to prevent any uncaught exceptions
            try:
                data = request.data.copy()
                print("Data copied successfully")
                
                password = data.get("password")
                confirm_password = data.get("confirm_password")
                
                print(f"Password check: password exists={bool(password)}, confirm_password exists={bool(confirm_password)}")

                if password != confirm_password:
                    print("Password mismatch error")
                    return Response(
                        {"error": "Passwords do not match."},
                        status=status.HTTP_400_BAD_REQUEST
                    )

                print("Creating serializer...")
                try:
                    serializer = EmployeeSerializer(data=data)
                    print(f"Serializer created successfully")
                except Exception as e:
                    print(f"Error creating serializer: {e}")
                    return Response({"error": f"Serializer error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
                
                print("Checking serializer validity...")
                if serializer.is_valid():
                    print("Serializer is valid, attempting to save...")
                    try:
                        employee = serializer.save()
                        print(f"Employee created successfully: {employee.email} (ID: {employee.pk})")
                        
                        # SKIP EMAIL SENDING ENTIRELY FOR NOW TO ISOLATE THE ISSUE
                        email_status = "Email sending skipped for testing"
                        print("Skipping email sending for debugging")
                        
                        # Return employee data with secure image URL
                        print("Creating response serializer...")
                        try:
                            employee_serializer = EmployeeSerializer(employee, context={'request': request})
                            print("Response serializer created successfully")
                        except Exception as e:
                            print(f"Error creating response serializer: {e}")
                            return Response({"error": f"Response serializer error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
                        
                        try:
                            response_data = {
                                "message": f"Account created successfully. Pending approval. {email_status}",
                                "employee": employee_serializer.data
                            }
                            print("Response data created successfully")
                            print("Returning success response")
                            return Response(response_data, status=status.HTTP_201_CREATED)
                        except Exception as e:
                            print(f"Error creating response data: {e}")
                            return Response({"error": f"Response data error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
                        
                    except Exception as e:
                        print(f"Error saving employee: {e}")
                        import traceback
                        print(f"Full traceback: {traceback.format_exc()}")
                        return Response({"error": f"Error creating employee: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)

                print(f"Serializer errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
                
            except Exception as e:
                print(f"Error in data processing: {e}")
                import traceback
                print(f"Full traceback: {traceback.format_exc()}")
                return Response({"error": f"Data processing error: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
            
        except Exception as e:
            print(f"=== CRITICAL ERROR in CreateEmployeeView: {e} ===")
            import traceback
            print(f"=== Full traceback: {traceback.format_exc()} ===")
            return Response(
                {"error": f"Critical error: {str(e)}"}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class CreateAdminEmployeeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        data = request.data.copy()

        # Auto-generate Company ID
        last_employee = Employee.objects.filter(company_id__startswith='MA').order_by('company_id').last()
        if last_employee:
            last_num = int(last_employee.company_id[2:])
            new_num = last_num + 1
        else:
            new_num = 1
        data['company_id'] = f"MA{new_num:04d}"

        # Set default password
        data['password'] = "1234"

        # Set default status
        data['status'] = "Pending"

        # Remove image field if not present
        if 'image' not in data:
            data['image'] = ''  # Will use model default

        serializer = EmployeeSerializer(data=data)
        if serializer.is_valid():
            employee = serializer.save()
            
            # Return employee data with secure image URL (including default image)
            employee_serializer = EmployeeSerializer(employee, context={'request': request})
            return Response({
                "message": "Employee account created successfully",
                "company_id": employee.company_id,
                "employee": employee_serializer.data
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
    parser_classes = [MultiPartParser, FormParser]  # For handling file uploads
    lookup_field = 'ticket_number'  # <-- ADD THIS LINE
    
    def get_queryset(self):
        user = self.request.user
        if user.role in ['System Admin', 'Ticket Coordinator']:
            return Ticket.objects.all()  # Admins and coordinators can see everything
        return Ticket.objects.filter(employee=user)  # Regular employees see their own
    
    def create(self, request, *args, **kwargs):
        data = request.data.copy()
        files = request.FILES.getlist('files[]')

        serializer = self.get_serializer(data=data, context={'request': request})
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

        # Serialize again to include attachments
        updated_serializer = self.get_serializer(instance, context={'request': request})
        headers = self.get_success_headers(updated_serializer.data)
        return Response(updated_serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def employee_profile_view(request):
    user = request.user
    serializer = EmployeeSerializer(user, context={'request': request})
    return Response(serializer.data)

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
            comments = ticket.comments.all().order_by('created_at')
        else:
            # Regular employees only see non-internal comments
            comments = ticket.comments.filter(is_internal=False).order_by('created_at')
        
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
        ticket.save()

        # Optional: create a comment for audit
        # TicketComment.objects.create(
        #     ticket=ticket,
        #     user=request.user,
        #     comment=f"Ticket approved and set to Open. Priority: {priority}, Dept: {department}. Notes: {approval_notes}",
        #     is_internal=True
        # )

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

        ticket.status = 'In Progress'  # or "In Progress"
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
        
        # Check if user has permission to update tickets
        if not (request.user.is_staff or request.user.role in ['System Admin', 'Ticket Coordinator']):
            return Response({'error': 'Permission denied'}, status=status.HTTP_403_FORBIDDEN)
        
        new_status = request.data.get('status')
        comment_text = request.data.get('comment', '').strip()
        
        if not new_status:
            return Response({'error': 'Status is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Validate status transition
        valid_statuses = ['Open', 'In Progress', 'Resolved', 'Closed', 'On Hold']
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
                'sub_category': ticket.sub_category,  # <-- ADD THIS
                'status': ticket.status,              # <-- ADD THIS
                'submit_date': ticket.submit_date,
                'employee_name': f"{ticket.employee.first_name} {ticket.employee.last_name}",
                'employee_department': ticket.employee.department,
                'has_attachment': bool(ticket.attachments.exists())
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
        'change_password': reverse('change_password', request=request, format=format),
        'upload_profile_image': reverse('upload_profile_image', request=request, format=format),
        'list_employees': reverse('list_employees', request=request, format=format),
        'approve_employee': reverse('approve_employee', args=[1], request=request, format=format),  # Example pk
        'get_ticket_detail': reverse('get_ticket_detail', args=[1], request=request, format=format),  # Example ID
        'approve_ticket': reverse('approve_ticket', args=[1], request=request, format=format),
        'reject_ticket': reverse('reject_ticket', args=[1], request=request, format=format),
        'claim_ticket': reverse('claim_ticket', args=[1], request=request, format=format),
        'update_ticket_status': reverse('update_ticket_status', args=[1], request=request, format=format),
        'get_new_tickets': reverse('get_new_tickets', request=request, format=format),
        'get_open_tickets': reverse('get_open_tickets', request=request, format=format),
        'get_my_tickets': reverse('get_my_tickets', request=request, format=format),
        'finalize_ticket': reverse('finalize_ticket', args=[1], request=request, format=format),
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
    image_file = request.FILES.get('image')
    if not image_file:
        return Response({'detail': 'No image provided.'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate file type
    if not image_file.content_type in ['image/png', 'image/jpeg', 'image/jpg']:
        return Response({'detail': 'Invalid file type.'}, status=status.HTTP_400_BAD_REQUEST)

    # Validate file size (max 2MB)
    if image_file.size > 2 * 1024 * 1024:
        return Response({'detail': 'File size exceeds 2MB.'}, status=status.HTTP_400_BAD_REQUEST)

    # Resize image to 1024x1024
    try:
        img = Image.open(image_file)
        img = img.convert('RGB')
        img = img.resize((1024, 1024))
        buffer = BytesIO()
        img.save(buffer, format='JPEG')
        file_content = ContentFile(buffer.getvalue())
        user.image.save(f"profile_{user.id}.jpg", file_content)
        user.save()
        
        # Return updated user data with secure image URL
        serializer = EmployeeSerializer(user, context={'request': request})
        return Response({
            'detail': 'Image uploaded successfully.',
            'user': serializer.data
        })
    except Exception as e:
        return Response({'detail': 'Failed to process image.'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_employees(request):
    # Only allow admins to view all employees
    if not request.user.is_staff and request.user.role != 'System Admin':
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
        print(f"Approve employee request received for ID: {pk}")
        
        try:
            employee = Employee.objects.get(pk=pk)
            print(f"Employee found: {employee.email}")
        except Employee.DoesNotExist:
            print(f"Employee with ID {pk} not found")
            return Response({'detail': 'Employee not found.'}, status=status.HTTP_404_NOT_FOUND)
            
        if employee.status == 'Approved':
            print(f"Employee {employee.email} already approved")
            return Response({'detail': 'Already approved.'}, status=status.HTTP_400_BAD_REQUEST)
        
        print(f"Approving employee {employee.email}...")
        employee.status = 'Approved'
        employee.save()
        print(f"Employee {employee.email} status updated to Approved")

        # Try to send approval email, but don't fail if email fails
        email_status = "Email not sent"
        try:
            print(f"Attempting to send approval email to {employee.email}...")
            html_content = send_account_approved_email(employee)
            msg = EmailMultiAlternatives(
                subject="Your Account is Ready!",
                body="Your account has been approved! You can now log in using the credentials you signed up with.",
                from_email="mapactivephsmartsupport@gmail.com",
                to=[employee.email],
            )
            msg.attach_alternative(html_content, "text/html")
            msg.send()
            email_status = "Employee approved and email sent."
            print(f"Approval email sent successfully to: {employee.email}")
        except Exception as e:
            # Log email error but don't fail the approval
            email_status = f"Employee approved, but email failed: {str(e)}"
            print(f"Failed to send approval email: {e}")
            import traceback
            print(f"Email error traceback: {traceback.format_exc()}")

        print(f"Returning success response: {email_status}")
        return Response({'detail': email_status}, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"Unexpected error in approve_employee: {e}")
        import traceback
        print(f"Full traceback: {traceback.format_exc()}")
        return Response(
            {'detail': f'Unexpected error: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

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

@api_view(['POST'])
@permission_classes([IsAuthenticated, IsSystemAdmin])
def reject_employee(request, pk):
    try:
        employee = Employee.objects.get(pk=pk)
        from .models import RejectedEmployeeAudit
        RejectedEmployeeAudit.objects.create(
            first_name=employee.first_name,
            last_name=employee.last_name,
            email=employee.email,
            company_id=employee.company_id,
            department=employee.department,
            reason=request.data.get("reason", ""),
        )
        # 2. Send rejection email
        html_content = send_account_rejected_email(employee)
        msg = EmailMultiAlternatives(
            subject="Account Creation Unsuccessful",
            body="We couldn’t create your account. Please double-check the information you’ve entered to ensure everything is correct. If you'd like, feel free to try creating your account again.\n\nIf you need any assistance or have questions, reach out to us at: mapactivephsmartsupport@gmail.com\n\nBest regards,\nMAP Active PH SmartSupport",
            from_email="mapactivephsmartsupport@gmail.com",
            to=[employee.email],
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send()
        # 3. Delete the employee
        employee.delete()
        return Response({'detail': 'Employee rejected, audited, and deleted.'}, status=status.HTTP_200_OK)
    except Exception as e:
        print("Reject employee error:", e)
        return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
def forgot_password(request):
    email = request.data.get('email')
    if not email:
        return Response({'detail': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        user = Employee.objects.get(email=email)
        if user.status == "Rejected":
            return Response({'detail': 'This email is associated with a rejected account and cannot reset password.'}, status=status.HTTP_400_BAD_REQUEST)
        token = default_token_generator.make_token(user)
        uidb64 = urlsafe_base64_encode(force_bytes(user.pk))
        reset_link = f"https://smartsupport-hdts-frontend.up.railway.app/reset-password/{uidb64}/{token}"

        subject = "Reset Your Password"
        from_email = "sethpelagio20@gmail.com"
        to = [email]
        text_content = (
            f"Hi {user.first_name},\n\n"
            "We received a request to reset your password. You can create a new one using the link below:\n"
            f"{reset_link}\n\n"
            "If you didn’t request a password reset, please ignore this message or contact us if you have any concerns.\n\n"
            "If you need further assistance, reach out to us at: mapactivephsmartsupport@gmail.com\n\n"
            "Best regards,\n"
            "MAP Active PH SmartSupport"
        )
        html_content = f"""
        <html>
          <body style="background:#f6f8fa;padding:32px 0;">
            <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:10px;box-shadow:0 2px 8px #0001;overflow:hidden;border:1px solid #e0e0e0;">
              <div style="padding:40px 32px 32px 32px;text-align:center;">
                <img src="https://smartsupport-hdts-frontend.up.railway.app/MapLogo.png" alt="SmartSupport Logo" style="width:90px;margin-bottom:24px;display:block;margin-left:auto;margin-right:auto;" />
                <div style="font-size:1.6rem;margin-bottom:28px;margin-top:8px;font-family:Verdana, Geneva, sans-serif;">
                  Password Reset Request
                </div>
                <div style="text-align:left;margin:0 auto 24px auto;">
                  <p style="font-size:16px;color:#222;margin:0 0 14px 0;font-family:Verdana, Geneva, sans-serif;">
                    Hi {user.first_name},
                  </p>
                  <p style="font-size:16px;color:#222;margin:0 0 18px 0;font-family:Verdana, Geneva, sans-serif;">
                    We received a request to reset your password. You can create a new one using the link below:
                  </p>
                  <div style="text-align:center;margin:24px 0;">
                    <a href="{reset_link}" style="display:inline-block;background:#2563eb;color:#fff;text-decoration:none;padding:12px 32px;border-radius:6px;font-weight:600;font-size:16px;font-family:Verdana, Geneva, sans-serif;">
                      Reset Password
                    </a>
                  </div>
                  <p style="font-size:15px;color:#444;margin-bottom:14px;font-family:Verdana, Geneva, sans-serif;">
                    If you didn’t request a password reset, please ignore this message or contact us if you have any concerns.
                  </p>
                  <p style="font-size:15px;color:#444;margin-bottom:14px;font-family:Verdana, Geneva, sans-serif;">
                    If you need further assistance, reach out to us at: <a href="mailto:mapactivephsmartsupport@gmail.com" style="color:#2563eb;text-decoration:none;">mapactivephsmartsupport@gmail.com</a>
                  </p>
                  <p style="font-size:15px;color:#444;margin-bottom:18px;font-family:Verdana, Geneva, sans-serif;">
                    Best regards,<br>
                    MAP Active PH SmartSupport
                  </p>
                </div>
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

        msg = EmailMultiAlternatives(subject, text_content, from_email, to)
        msg.attach_alternative(html_content, "text/html")
        msg.send()

        return Response({'detail': 'Password reset link sent.'}, status=status.HTTP_200_OK)
    except Employee.DoesNotExist:
        return Response({'detail': 'Invalid Email.'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def withdraw_ticket(request, ticket_id):
    """
    Allow the ticket owner to withdraw their ticket if not resolved.
    """
    try:
        ticket = Ticket.objects.get(id=ticket_id)
        # Only the ticket owner can withdraw
        if ticket.employee != request.user:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        if ticket.status == "Resolved":
            return Response({'error': 'Cannot withdraw a resolved ticket.'}, status=status.HTTP_400_BAD_REQUEST)
        if ticket.status == "Withdrawn":
            return Response({'error': 'Ticket already withdrawn.'}, status=status.HTTP_400_BAD_REQUEST)
        ticket.status = "Withdrawn"
        ticket.save()

        # Save the withdrawal comment if provided
        comment = request.data.get("comment", "").strip()
        if comment:
            TicketComment.objects.create(
                ticket=ticket,
                user=request.user,
                comment=f"Ticket withdrawn: {comment}",
                is_internal=False
            )

        return Response({'message': 'Ticket withdrawn successfully.', 'status': ticket.status}, status=status.HTTP_200_OK)
    except Ticket.DoesNotExist:
        return Response({'error': 'Ticket not found.'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def close_ticket(request, ticket_id):
    """
    Allow the ticket owner (employee) to close their own ticket if it's resolved.
    """
    try:
        ticket = Ticket.objects.get(id=ticket_id)
        # Only the ticket owner can close
        if ticket.employee != request.user:
            return Response({'error': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)
        if ticket.status != "Resolved":
            return Response({'error': 'Only resolved tickets can be closed.'}, status=status.HTTP_400_BAD_REQUEST)
        if ticket.status == "Closed":
            return Response({'error': 'Ticket already closed.'}, status=status.HTTP_400_BAD_REQUEST)
        ticket.status = "Closed"
        ticket.time_closed = timezone.now()
        if ticket.submit_date:
            ticket.resolution_time = ticket.time_closed - ticket.submit_date
        ticket.save()

        # Save the closing comment if provided
        comment = request.data.get("comment", "").strip()
        if comment:
            TicketComment.objects.create(
                ticket=ticket,
                user=request.user,
                comment=f"Ticket closed: {comment}",
                is_internal=False
            )

        return Response({'message': 'Ticket closed successfully.', 'status': ticket.status}, status=status.HTTP_200_OK)
    except Ticket.DoesNotExist:
        return Response({'error': 'Ticket not found.'}, status=status.HTTP_404_NOT_FOUND)

@api_view(['POST'])
def reset_password(request):
    uidb64 = request.data.get('uidb64')
    token = request.data.get('token')
    new_password = request.data.get('new_password')

    if not uidb64 or not token or not new_password:
        return Response({'detail': 'Missing data.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        uid = urlsafe_base64_decode(uidb64).decode()
        user = get_user_model().objects.get(pk=uid)
    except Exception:
        return Response({'detail': 'Invalid user.'}, status=status.HTTP_400_BAD_REQUEST)

    if not default_token_generator.check_token(user, token):
        return Response({'detail': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

    user.set_password(new_password)
    user.save()
    return Response({'detail': 'Password reset successful.'}, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_password(request):
    user = request.user
    current_password = request.data.get('current_password')
    if not current_password:
        return Response({'detail': 'Current password is required.'}, status=status.HTTP_400_BAD_REQUEST)
    if user.check_password(current_password):
        return Response({'detail': 'Password correct.'}, status=status.HTTP_200_OK)
    return Response({'detail': 'Current password is incorrect.'}, status=status.HTTP_400_BAD_REQUEST)

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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def rejected_employee_audit_list(request):
    from .models import RejectedEmployeeAudit
    audits = RejectedEmployeeAudit.objects.order_by('-rejected_at')
    data = [
        {
            "id": audit.id,
            "company_id": audit.company_id,
            "first_name": audit.first_name,
            "last_name": audit.last_name,
            "email": audit.email,
            "department": audit.department,
            "timestamp": audit.rejected_at,
        }
        for audit in audits
    ]
    return Response(data)

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