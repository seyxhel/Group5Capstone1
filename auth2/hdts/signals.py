"""
Django signals for the HDTS app to trigger user and user_system_role syncing.
Listens to post_save and post_delete signals and sends tasks to the message broker.
Similar to TTS, but for HDTS-specific user updates and deletes.
"""

from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
import logging
from threading import Thread

logger = logging.getLogger(__name__)


@receiver(post_save, sender='users.User')
def user_post_save(sender, instance, created, **kwargs):
    """
    Signal handler for when a User is created or updated.
    Checks if user belongs to HDTS system and syncs relevant information.
    Runs in background thread to prevent blocking.
    """
    def send_sync_task():
        try:
            # Check if this user belongs to HDTS system
            from system_roles.models import UserSystemRole
            
            is_hdts_member = UserSystemRole.objects.filter(
                user=instance,
                system__slug='hdts'
            ).exists()
            
            if is_hdts_member:
                action = 'create' if created else 'update'
                logger.info(f"User {instance.id} ({instance.email}) {action}d, syncing to HDTS subscribers")
                
                from celery import current_app
                
                # Prepare the user data
                user_data = {
                    "user_id": instance.id,
                    "email": instance.email,
                    "username": instance.username,
                    "first_name": instance.first_name,
                    "last_name": instance.last_name,
                    "full_name": instance.get_full_name(),
                    "phone_number": instance.phone_number,
                    "company_id": instance.company_id,
                    "department": instance.department,
                    "status": instance.status,
                    "profile_picture": instance.profile_picture.url if instance.profile_picture else None,
                    "is_active": instance.is_active,
                    "is_staff": instance.is_staff,
                    "date_joined": instance.date_joined.isoformat() if instance.date_joined else None,
                    "approved_at": instance.approved_at.isoformat() if instance.approved_at else None,
                    "rejected_at": instance.rejected_at.isoformat() if instance.rejected_at else None,
                    "action": action,
                }
                
                # Send directly to HDTS handlers via Celery task with timeout
                try:
                    current_app.send_task(
                        'hdts.tasks.sync_user',
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
    try:
        # Check if this user belonged to HDTS system (we use try/except since relations might be gone)
        from system_roles.models import UserSystemRole
        
        # Try to check if user had HDTS role (may fail if already deleted from join table)
        was_hdts_member = UserSystemRole.objects.filter(
            user=instance,
            system__slug='hdts'
        ).exists()
        
        # If not found via relations, we still want to potentially sync the delete
        # So we'll log it but not fail
        logger.info(f"User {instance.id} ({instance.email}) deleted, syncing to HDTS subscribers")
        
        from celery import current_app
        
        # Prepare the user data before deletion
        user_data = {
            "user_id": instance.id,
            "email": instance.email,
            "username": instance.username,
            "first_name": instance.first_name,
            "last_name": instance.last_name,
            "full_name": instance.get_full_name(),
            "phone_number": instance.phone_number,
            "company_id": instance.company_id,
            "department": instance.department,
            "status": instance.status,
            "profile_picture": instance.profile_picture.url if instance.profile_picture else None,
            "is_active": instance.is_active,
            "is_staff": instance.is_staff,
            "date_joined": instance.date_joined.isoformat() if instance.date_joined else None,
            "approved_at": instance.approved_at.isoformat() if instance.approved_at else None,
            "rejected_at": instance.rejected_at.isoformat() if instance.rejected_at else None,
            "action": 'delete',
        }
        
        # Send directly to HDTS handlers task
        current_app.send_task(
            'hdts.tasks.sync_user',
            args=[user_data],
            queue='hdts.user.sync',
            routing_key='hdts.user.sync',
        )
    except Exception as e:
        logger.error(f"Error in user_post_delete signal: {str(e)}")


@receiver(post_save, sender='system_roles.UserSystemRole')
def user_system_role_post_save(sender, instance, created, **kwargs):
    """
    Signal handler for when a UserSystemRole is created or updated.
    Only syncs if the role belongs to the HDTS system.
    Runs in background thread to prevent blocking.
    """
    def send_sync_task():
        try:
            # Check if this user_system_role is for HDTS system
            if instance.role.system.slug == 'hdts':
                action = 'create' if created else 'update'
                logger.info(f"UserSystemRole {instance.id} (user={instance.user.email}, role={instance.role.name}) {action}d, syncing to HDTS subscribers")
                
                from celery import current_app
                
                # Prepare the full user_system_role data
                user_system_role_data = {
                    "user_system_role_id": instance.id,
                    "user_id": instance.user.id,
                    "user_email": instance.user.email,
                    "user_full_name": instance.user.get_full_name(),
                    "system": instance.system.slug,
                    "role_id": instance.role.id,
                    "role_name": instance.role.name,
                    "assigned_at": instance.assigned_at.isoformat(),
                    "is_active": instance.is_active,
                    "settings": instance.settings,
                    "action": action,
                }
                
                # Send directly to HDTS handlers task with timeout
                try:
                    current_app.send_task(
                        'hdts.tasks.sync_user_system_role',
                        args=[user_system_role_data],
                        queue='hdts.user_system_role.sync',
                        routing_key='hdts.user_system_role.sync',
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
    Sends the full user_system_role data before deletion for sync purposes.
    """
    try:
        # Check if this user_system_role belonged to HDTS system
        if instance.role.system.slug == 'hdts':
            logger.info(f"UserSystemRole {instance.id} (user={instance.user.email}, role={instance.role.name}) deleted, syncing to HDTS subscribers")
            
            from celery import current_app
            
            # Prepare the data before it's deleted
            user_system_role_data = {
                "user_system_role_id": instance.id,
                "user_id": instance.user.id,
                "user_email": instance.user.email,
                "user_full_name": instance.user.get_full_name(),
                "system": instance.system.slug,
                "role_id": instance.role.id,
                "role_name": instance.role.name,
                "assigned_at": instance.assigned_at.isoformat(),
                "is_active": instance.is_active,
                "settings": instance.settings,
                "action": 'delete',
            }
            
            # Send directly to HDTS handlers task
            current_app.send_task(
                'hdts.tasks.sync_user_system_role',
                args=[user_system_role_data],
                queue='hdts.user_system_role.sync',
                routing_key='hdts.user_system_role.sync',
            )
    except Exception as e:
        logger.error(f"Error in user_system_role_post_delete signal: {str(e)}")
