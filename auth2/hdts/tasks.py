"""
Celery tasks for syncing simplified HDTS user information to backend services.
Sends combined user + role data in a single sync operation via the message broker.
"""

from celery import shared_task
import logging

logger = logging.getLogger(__name__)


@shared_task(name='hdts.tasks.sync_hdts_user')
def sync_hdts_user(user_data):
    """
    Sync combined user + role information to HDTS subscribers via the message broker.
    Handles create, update, and delete actions for total sync.
    
    The user_data includes both user profile and their role in a single object,
    eliminating the need for separate role syncs.
    
    Args:
        user_data (dict): The combined user + role data to sync including action type
    
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
        
        logger.info(f"Syncing HDTS user {user_id} ({user_data.get('email')}) with role '{user_data.get('role')}' to subscribers with action: {action}")
        logger.debug(f"User data: {user_data}")
        
        # Send message to HDTS subscribers via Celery task
        # This will be picked up by any service listening to hdts.user.sync queue
        current_app.send_task(
            'hdts.consumer.process_hdts_user_sync',
            args=[user_data],
            queue='hdts.user.sync',
            routing_key='hdts.user.sync',
        )
        
        logger.info(f"HDTS user {user_id} sync message sent to subscribers with action: {action}")
        return {
            "status": "success",
            "user_id": user_id,
            "action": action,
        }
    
    except Exception as e:
        logger.error(f"Error syncing HDTS user: {str(e)}")
        return {"status": "error", "error": str(e)}

