"""
Celery tasks for syncing HDTS user information to other services.
These tasks send newly created/updated/deleted users and user_system_roles 
that are attached to the HDTS system via the message broker.
"""

from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(name='hdts.tasks.sync_user')
def sync_user(user_data):
    """
    Sync user information to HDTS subscribers via the message broker.
    Handles create, update, and delete actions for total sync.
    
    Args:
        user_data (dict): The user data to sync including action type
    
    Returns:
        dict: Status of the sync operation
    """
    from celery import current_app
    
    try:
        action = user_data.get('action', 'update')
        user_id = user_data.get('user_id')
        
        # For delete action, we have the full data in user_data
        # For create/update, verify user exists (except for deletes)
        if action != 'delete':
            from users.models import User
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                logger.error(f"User {user_id} not found for {action} action")
                return {"status": "error", "error": "User not found"}
        
        # Add action for the consumer to handle
        user_data['action'] = action
        
        logger.info(f"Syncing user {user_id} to HDTS subscribers with action: {action}")
        logger.debug(f"User data: {user_data}")
        
        # Send message to HDTS subscribers via Celery task
        # This will be picked up by any service listening to hdts.user.sync queue
        current_app.send_task(
            'hdts.consumer.process_user_sync',
            args=[user_data],
            queue='hdts.user.sync',
            routing_key='hdts.user.sync',
        )
        
        logger.info(f"User {user_id} sync message sent to HDTS subscribers with action: {action}")
        return {
            "status": "success",
            "user_id": user_id,
            "action": action,
        }
    
    except Exception as e:
        logger.error(f"Error syncing user: {str(e)}")
        return {"status": "error", "error": str(e)}


@shared_task(name='hdts.tasks.sync_user_system_role')
def sync_user_system_role(user_system_role_data):
    """
    Sync a UserSystemRole object to HDTS subscribers via the message broker.
    Supports create, update, and delete actions for total sync.
    
    Args:
        user_system_role_data (dict): The UserSystemRole data to sync including action type
    
    Returns:
        dict: Status of the sync operation
    """
    from celery import current_app
    
    try:
        action = user_system_role_data.get('action', 'update')
        user_system_role_id = user_system_role_data.get('user_system_role_id')
        user_id = user_system_role_data.get('user_id')
        
        # For delete action, we have the full data in user_system_role_data
        # For create/update, verify UserSystemRole exists
        if action != 'delete':
            from system_roles.models import UserSystemRole
            try:
                user_system_role = UserSystemRole.objects.get(id=user_system_role_id)
                
                # Verify it's for HDTS system
                if user_system_role.role.system.slug != 'hdts':
                    logger.info(f"UserSystemRole {user_system_role_id} is not for HDTS system, skipping sync")
                    return {"status": "skipped", "reason": "not_hdts_system"}
            except UserSystemRole.DoesNotExist:
                logger.error(f"UserSystemRole {user_system_role_id} not found")
                return {"status": "error", "error": "UserSystemRole not found"}
        
        # Add action for the consumer to handle
        user_system_role_data['action'] = action
        
        logger.info(f"Syncing UserSystemRole {user_system_role_id} (user={user_id}) to HDTS subscribers with action: {action}")
        logger.debug(f"UserSystemRole data: {user_system_role_data}")
        
        # Send message to HDTS subscribers via Celery task
        current_app.send_task(
            'hdts.consumer.process_user_system_role_sync',
            args=[user_system_role_data],
            queue='hdts.user_system_role.sync',
            routing_key='hdts.user_system_role.sync',
        )
        
        logger.info(f"UserSystemRole {user_system_role_id} sync message sent to HDTS subscribers with action: {action}")
        return {
            "status": "success",
            "user_system_role_id": user_system_role_id,
            "user_id": user_id,
            "action": action,
        }
    
    except Exception as e:
        logger.error(f"Error syncing UserSystemRole: {str(e)}")
        return {"status": "error", "error": str(e)}
