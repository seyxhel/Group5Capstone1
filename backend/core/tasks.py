from celery import shared_task
from django.utils import timezone
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)

@shared_task(name='tickets.tasks.receive_ticket')
def push_ticket_to_workflow(ticket_data):
    # This will be picked up and executed by `workflow_api`
    pass

@shared_task(name='send_ticket_status')
def update_ticket_status_from_queue(ticket_number, new_status):
    from .models import Ticket
    try:
        ticket = Ticket.objects.get(ticket_number=ticket_number)
        ticket.status = new_status
        ticket.save()
        print(f"Ticket with ticket_number {ticket_number} status updated to {new_status}")
    except Ticket.DoesNotExist:
        print(f"Ticket with ticket_number {ticket_number} does not exist")

@shared_task(name='auto_close_resolved_tickets')
def auto_close_resolved_tickets():
    """
    Automatically close tickets that have been in 'Resolved' status for 72 hours or more.
    Sets date_completed but does NOT set csat_rating or feedback (only manual close does that).
    """
    from .models import Ticket, TicketComment
    
    # Calculate the cutoff time (72 hours ago)
    cutoff_time = timezone.now() - timedelta(hours=72)
    
    # Find all tickets that are Resolved and have been updated more than 72 hours ago
    resolved_tickets = Ticket.objects.filter(
        status='Resolved',
        update_date__lte=cutoff_time
    )
    
    closed_count = 0
    for ticket in resolved_tickets:
        try:
            ticket.status = 'Closed'
            ticket.time_closed = timezone.now()
            ticket.date_completed = timezone.now()
            
            # Calculate resolution time if not already set
            if ticket.submit_date and not ticket.resolution_time:
                ticket.resolution_time = timezone.now() - ticket.submit_date
            
            ticket.save()
            
            # Add a comment noting the auto-closure
            TicketComment.objects.create(
                ticket=ticket,
                user=None,
                comment="Ticket automatically closed after 72 hours in Resolved status.",
                is_internal=False
            )
            
            closed_count += 1
            print(f"Auto-closed ticket {ticket.ticket_number}")
            
        except Exception as e:
            print(f"Error auto-closing ticket {ticket.ticket_number}: {e}")
            continue
    
    return f"Auto-closed {closed_count} tickets"


@shared_task(name='hdts.consumer.process_user_sync')
def process_hdts_user_sync(user_data):
    """
    Receive and process HDTS user sync messages from the auth service.
    Handles create, update, and delete actions.
    
    Args:
        user_data (dict): User data from HDTS auth service containing:
            - user_id, email, username, first_name, last_name, full_name
            - phone_number, company_id, department, status
            - profile_picture, is_active, is_staff
            - date_joined, approved_at, rejected_at
            - action: 'create', 'update', or 'delete'
    """
    from .models import HDTSUser
    
    try:
        action = user_data.get('action', 'update')
        hdts_user_id = user_data.get('user_id')
        
        logger.info(f"Processing HDTS user sync: user_id={hdts_user_id}, action={action}")
        
        if action == 'delete':
            # Delete the user record
            deleted_count, _ = HDTSUser.objects.filter(hdts_user_id=hdts_user_id).delete()
            logger.info(f"Deleted {deleted_count} HDTS user record(s) for user_id={hdts_user_id}")
            return {
                "status": "success",
                "action": "delete",
                "user_id": hdts_user_id,
                "deleted_count": deleted_count,
            }
        
        elif action in ['create', 'update']:
            # Create or update the user record
            hdts_user, created = HDTSUser.objects.update_or_create(
                hdts_user_id=hdts_user_id,
                defaults={
                    'email': user_data.get('email', ''),
                    'username': user_data.get('username', ''),
                    'first_name': user_data.get('first_name', ''),
                    'last_name': user_data.get('last_name', ''),
                    'full_name': user_data.get('full_name', ''),
                    'phone_number': user_data.get('phone_number'),
                    'company_id': user_data.get('company_id', ''),
                    'department': user_data.get('department'),
                    'status': user_data.get('status', 'Pending'),
                    'is_active': user_data.get('is_active', True),
                    'is_staff': user_data.get('is_staff', False),
                    'profile_picture': user_data.get('profile_picture'),
                    'date_joined': user_data.get('date_joined'),
                    'approved_at': user_data.get('approved_at'),
                    'rejected_at': user_data.get('rejected_at'),
                }
            )
            
            action_verb = "Created" if created else "Updated"
            logger.info(f"{action_verb} HDTS user: {hdts_user.email} (user_id={hdts_user_id})")
            
            return {
                "status": "success",
                "action": action,
                "user_id": hdts_user_id,
                "created": created,
                "hdts_user": {
                    "id": hdts_user.id,
                    "email": hdts_user.email,
                    "full_name": hdts_user.full_name,
                }
            }
        
        else:
            logger.warning(f"Unknown action '{action}' for user_id={hdts_user_id}")
            return {
                "status": "warning",
                "message": f"Unknown action: {action}",
                "user_id": hdts_user_id,
            }
    
    except Exception as e:
        logger.error(f"Error processing HDTS user sync: {str(e)}", exc_info=True)
        return {
            "status": "error",
            "error": str(e),
            "user_id": user_data.get('user_id'),
        }


@shared_task(name='hdts.consumer.process_user_system_role_sync')
def process_hdts_user_system_role_sync(user_system_role_data):
    """
    Receive and process HDTS user system role sync messages from the auth service.
    Handles create, update, and delete actions for user role assignments.
    
    Args:
        user_system_role_data (dict): User role data from HDTS auth service containing:
            - user_system_role_id, user_id, user_email, user_full_name
            - role_id, role_name, assigned_at, is_active, settings
            - action: 'create', 'update', or 'delete'
    """
    from .models import HDTSUser, HDTSUserRole
    
    try:
        action = user_system_role_data.get('action', 'update')
        user_system_role_id = user_system_role_data.get('user_system_role_id')
        hdts_user_id = user_system_role_data.get('user_id')
        role_name = user_system_role_data.get('role_name')
        
        logger.info(f"Processing HDTS user role sync: user_role_id={user_system_role_id}, user_id={hdts_user_id}, role={role_name}, action={action}")
        
        # Get or create the HDTSUser first
        try:
            hdts_user = HDTSUser.objects.get(hdts_user_id=hdts_user_id)
        except HDTSUser.DoesNotExist:
            logger.warning(f"HDTS user {hdts_user_id} not found, creating placeholder")
            # Create a minimal user record if it doesn't exist yet
            hdts_user = HDTSUser.objects.create(
                hdts_user_id=hdts_user_id,
                email=user_system_role_data.get('user_email', f'user{hdts_user_id}@hdts.local'),
                username=f'user{hdts_user_id}',
                first_name=user_system_role_data.get('user_full_name', '').split(' ')[0] if user_system_role_data.get('user_full_name') else '',
                last_name=user_system_role_data.get('user_full_name', '').split(' ')[-1] if user_system_role_data.get('user_full_name') else '',
                full_name=user_system_role_data.get('user_full_name', ''),
                company_id='',
            )
        
        if action == 'delete':
            # Delete the role assignment
            deleted_count, _ = HDTSUserRole.objects.filter(hdts_user_role_id=user_system_role_id).delete()
            logger.info(f"Deleted {deleted_count} HDTS user role record(s) for user_role_id={user_system_role_id}")
            return {
                "status": "success",
                "action": "delete",
                "user_system_role_id": user_system_role_id,
                "deleted_count": deleted_count,
            }
        
        elif action in ['create', 'update']:
            # Create or update the role assignment
            hdts_user_role, created = HDTSUserRole.objects.update_or_create(
                hdts_user_role_id=user_system_role_id,
                defaults={
                    'hdts_user': hdts_user,
                    'role_name': role_name,
                    'role_id': user_system_role_data.get('role_id'),
                    'assigned_at': user_system_role_data.get('assigned_at'),
                    'is_active': user_system_role_data.get('is_active', True),
                    'settings': user_system_role_data.get('settings'),
                }
            )
            
            action_verb = "Assigned" if created else "Updated"
            logger.info(f"{action_verb} role '{role_name}' to user {hdts_user.email}")
            
            return {
                "status": "success",
                "action": action,
                "user_system_role_id": user_system_role_id,
                "user_id": hdts_user_id,
                "role": role_name,
                "created": created,
            }
        
        else:
            logger.warning(f"Unknown action '{action}' for user_system_role_id={user_system_role_id}")
            return {
                "status": "warning",
                "message": f"Unknown action: {action}",
                "user_system_role_id": user_system_role_id,
            }
    
    except Exception as e:
        logger.error(f"Error processing HDTS user role sync: {str(e)}", exc_info=True)
        return {
            "status": "error",
            "error": str(e),
            "user_system_role_id": user_system_role_data.get('user_system_role_id'),
        }