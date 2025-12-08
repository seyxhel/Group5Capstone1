"""
Django signals for the HDTS app to trigger user syncing (combined with roles).
Listens to post_save and post_delete signals and sends combined user+role data
to the message broker in a single sync task.
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
import logging
from threading import Thread

logger = logging.getLogger(__name__)


def _get_hdts_user_role(user):
    """
    Helper function to get the role name for an HDTS user.
    Returns the role name if the user has a role in HDTS system, None otherwise.
    """
    try:
        from system_roles.models import UserSystemRole
        user_role = UserSystemRole.objects.filter(
            user=user,
            system__slug='hdts'
        ).select_related('role').first()
        return user_role.role.name if user_role else None
    except Exception as e:
        logger.warning(f"Error getting HDTS role for user {user.id}: {str(e)}")
        return None


def _prepare_hdts_user_data(user, action='update'):
    """
    Helper function to prepare combined user + role data for HDTS sync.
    Combines user profile information with their HDTS role in a single object.
    """
    role = _get_hdts_user_role(user)
    
    return {
        "user_id": user.id,
        "email": user.email,
        "username": user.username,
        "first_name": user.first_name,
        "last_name": user.last_name,
        "middle_name": getattr(user, 'middle_name', ''),
        "suffix": getattr(user, 'suffix', ''),
        "company_id": user.company_id,
        "department": user.department,
        "role": role,
        "status": user.status,
        "notified": getattr(user, 'notified', False),
        "profile_picture": user.profile_picture.url if user.profile_picture else None,
        "action": action,
    }


def _prepare_hdts_employee_data(employee, action='update'):
    """
    Helper function to prepare employee data for HDTS sync.
    Sends employee data as-is with role set to 'employee'.
    """
    return {
        "employee_id": employee.id,
        "user_id": employee.user.id if employee.user else None,
        "email": employee.email,
        "username": employee.username,
        "first_name": employee.first_name,
        "last_name": employee.last_name,
        "middle_name": employee.middle_name or '',
        "suffix": employee.suffix or '',
        "phone_number": employee.phone_number,
        "company_id": employee.company_id,
        "department": employee.department,
        "status": employee.status,
        "notified": employee.notified,
        "profile_picture": employee.profile_picture.url if employee.profile_picture else None,
        "role": "employee",
        "action": action,
    }


@receiver(post_save, sender='users.User')
def user_post_save(sender, instance, created, **kwargs):
    """
    Signal handler for when a User is created or updated.
    Checks if user belongs to HDTS system and syncs combined user+role information.
    Runs in background thread to prevent blocking.
    """
    def send_sync_task():
        try:
            # Check if this user belongs to HDTS system
            role = _get_hdts_user_role(instance)
            
            if role:
                action = 'create' if created else 'update'
                logger.info(f"User {instance.id} ({instance.email}) {action}d with role {role}, syncing to HDTS subscribers")
                
                from celery import current_app
                
                # Prepare combined user + role data
                user_data = _prepare_hdts_user_data(instance, action=action)
                
                # Send directly to HDTS handlers via Celery task with timeout
                try:
                    current_app.send_task(
                        'hdts.tasks.sync_hdts_user',
                        args=[user_data],
                        queue='hdts.user.sync',
                        routing_key='hdts.user.sync',
                        retry=False,
                        time_limit=10,
                    )
                except Exception as celery_error:
                    logger.warning(f"Celery task send failed (non-blocking): {str(celery_error)}")
        except Exception as e:
            logger.error(f"Error in user_post_save signal: {str(e)}")
    
    # Send in background thread to prevent blocking the response
    thread = Thread(target=send_sync_task, daemon=True)
    thread.start()


@receiver(post_delete, sender='users.User')
def user_post_delete(sender, instance, **kwargs):
    """
    Signal handler for when a User is deleted.
    Only processes users that belonged to the HDTS system.
    """
    def send_sync_task():
        try:
            # We can't query for the role after deletion, but we can still sync the delete action
            # The consumer will need to handle the delete based on email/user_id
            logger.info(f"User {instance.id} ({instance.email}) deleted, syncing to HDTS subscribers")
            
            from celery import current_app
            
            # Prepare user data for deletion (include what we have)
            user_data = {
                "user_id": instance.id,
                "email": instance.email,
                "username": instance.username,
                "first_name": instance.first_name,
                "last_name": instance.last_name,
                "middle_name": getattr(instance, 'middle_name', ''),
                "suffix": getattr(instance, 'suffix', ''),
                "company_id": instance.company_id,
                "department": instance.department,
                "status": instance.status,
                "action": 'delete',
            }
            
            # Send directly to HDTS handlers task
            current_app.send_task(
                'hdts.tasks.sync_hdts_user',
                args=[user_data],
                queue='hdts.user.sync',
                routing_key='hdts.user.sync',
            )
        except Exception as e:
            logger.error(f"Error in user_post_delete signal: {str(e)}")
    
    # Send in background thread to prevent blocking the response
    thread = Thread(target=send_sync_task, daemon=True)
    thread.start()


@receiver(post_save, sender='system_roles.UserSystemRole')
def user_system_role_post_save(sender, instance, created, **kwargs):
    """
    Signal handler for when a UserSystemRole is created or updated.
    Only syncs if the role belongs to the HDTS system.
    Sends combined user + role data in a single sync operation.
    Runs in background thread to prevent blocking.
    """
    def send_sync_task():
        try:
            # Check if this user_system_role is for HDTS system
            if instance.role.system.slug == 'hdts':
                action = 'create' if created else 'update'
                logger.info(f"UserSystemRole {instance.id} (user={instance.user.email}, role={instance.role.name}) {action}d, syncing combined user+role to HDTS subscribers")
                
                from celery import current_app
                
                # Prepare combined user + role data with the new role
                user_data = _prepare_hdts_user_data(instance.user, action=action)
                # Override with the current role from the signal instance
                user_data['role'] = instance.role.name
                
                # Send directly to HDTS handlers task with timeout
                try:
                    current_app.send_task(
                        'hdts.tasks.sync_hdts_user',
                        args=[user_data],
                        queue='hdts.user.sync',
                        routing_key='hdts.user.sync',
                        retry=False,
                        time_limit=10,
                    )
                except Exception as celery_error:
                    logger.warning(f"Celery task send failed (non-blocking): {str(celery_error)}")
        except Exception as e:
            logger.error(f"Error in user_system_role_post_save signal: {str(e)}")
    
    # Send in background thread to prevent blocking the response
    thread = Thread(target=send_sync_task, daemon=True)
    thread.start()


@receiver(post_delete, sender='system_roles.UserSystemRole')
def user_system_role_post_delete(sender, instance, **kwargs):
    """
    Signal handler for when a UserSystemRole is deleted.
    Sends the combined user+role data before deletion for sync purposes.
    """
    def send_sync_task():
        try:
            # Check if this user_system_role belonged to HDTS system
            if instance.role.system.slug == 'hdts':
                logger.info(f"UserSystemRole {instance.id} (user={instance.user.email}, role={instance.role.name}) deleted, syncing to HDTS subscribers")
                
                from celery import current_app
                
                # Prepare the combined user data before it's deleted
                user_data = _prepare_hdts_user_data(instance.user, action='delete')
                # Override with the deleted role
                user_data['role'] = instance.role.name
                
                # Send directly to HDTS handlers task
                current_app.send_task(
                    'hdts.tasks.sync_hdts_user',
                    args=[user_data],
                    queue='hdts.user.sync',
                    routing_key='hdts.user.sync',
                )
        except Exception as e:
            logger.error(f"Error in user_system_role_post_delete signal: {str(e)}")
    
    # Send in background thread to prevent blocking the response
    thread = Thread(target=send_sync_task, daemon=True)
    thread.start()


@receiver(post_save, sender='hdts.Employees')
def employee_post_save(sender, instance, created, **kwargs):
    """
    Signal handler for when an Employee is created or updated.
    Syncs employee data with role set to 'employee' to separate queue.
    Runs in background thread to prevent blocking.
    """
    def send_sync_task():
        try:
            action = 'create' if created else 'update'
            logger.info(f"Employee {instance.id} ({instance.email}) {action}d, syncing to external employee subscribers")
            
            from celery import current_app
            
            # Prepare employee data with role set to 'employee'
            employee_data = _prepare_hdts_employee_data(instance, action=action)
            
            # Send to SEPARATE queue for employees (hdts.employee.sync)
            # Task will be processed by backend Celery worker
            try:
                current_app.send_task(
                    'core.tasks.process_hdts_employee_sync',
                    args=[employee_data],
                    queue='hdts.employee.sync',
                    routing_key='hdts.employee.sync',
                    retry=False,
                    time_limit=10,
                )
            except Exception as celery_error:
                logger.warning(f"Celery task send failed (non-blocking): {str(celery_error)}")
        except Exception as e:
            logger.error(f"Error in employee_post_save signal: {str(e)}")
    
    # Send in background thread to prevent blocking the response
    thread = Thread(target=send_sync_task, daemon=True)
    thread.start()


@receiver(post_delete, sender='hdts.Employees')
def employee_post_delete(sender, instance, **kwargs):
    """
    Signal handler for when an Employee is deleted.
    Syncs employee deletion to separate queue for external employee subscribers.
    """
    def send_sync_task():
        try:
            logger.info(f"Employee {instance.id} ({instance.email}) deleted, syncing to external employee subscribers")
            
            from celery import current_app
            
            # Prepare employee data for deletion
            employee_data = _prepare_hdts_employee_data(instance, action='delete')
            
            # Send to SEPARATE queue for employees (hdts.employee.sync)
            # Task will be processed by backend Celery worker
            current_app.send_task(
                'core.tasks.process_hdts_employee_sync',
                args=[employee_data],
                queue='hdts.employee.sync',
                routing_key='hdts.employee.sync',
            )
        except Exception as e:
            logger.error(f"Error in employee_post_delete signal: {str(e)}")
    
    # Send in background thread to prevent blocking the response
    thread = Thread(target=send_sync_task, daemon=True)
    thread.start()
