import requests
import logging
from django.conf import settings
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)


class NotificationClient:
    """
    HTTP client for communicating with the notification microservice
    """
    
    def __init__(self):
        # Use lazy evaluation to avoid settings access during import
        self._base_url = None
        self._timeout = None
        self._enabled = None
    
    @property
    def base_url(self):
        if self._base_url is None:
            self._base_url = getattr(settings, 'NOTIFICATION_SERVICE_URL', 'http://localhost:8001')
        return self._base_url
    
    @property
    def timeout(self):
        if self._timeout is None:
            self._timeout = getattr(settings, 'NOTIFICATION_SERVICE_TIMEOUT', 10)
        return self._timeout
    
    @property
    def enabled(self):
        if self._enabled is None:
            self._enabled = getattr(settings, 'NOTIFICATIONS_ENABLED', True)
        return self._enabled
    
    def send_notification(self, user_id: str, user_email: str, user_name: str, 
                         notification_type: str, context_data: Optional[Dict[str, Any]] = None,
                         ip_address: Optional[str] = None, user_agent: Optional[str] = None) -> bool:
        """
        Send a notification request to the notification service
        
        Args:
            user_id: UUID of the user
            user_email: Email of the user
            user_name: Name of the user
            notification_type: Type of notification to send
            context_data: Additional context data for the notification
            ip_address: IP address of the user
            user_agent: User agent string
            
        Returns:
            bool: True if notification was sent successfully, False otherwise
        """
        if not self.enabled:
            logger.info("Notifications are disabled, skipping notification send")
            return True
            
        try:
            payload = {
                'user_id': str(user_id),
                'user_email': user_email,
                'user_name': user_name or '',
                'notification_type': notification_type,
                'context_data': context_data or {},
                'ip_address': ip_address,
                'user_agent': user_agent or '',
            }
            
            response = requests.post(
                f"{self.base_url}/api/v1/send/",
                json=payload,
                timeout=self.timeout,
                headers={'Content-Type': 'application/json'}
            )
            
            if response.status_code == 200:
                logger.info(f"Notification '{notification_type}' sent successfully to {user_email}")
                return True
            else:
                logger.error(f"Failed to send notification '{notification_type}' to {user_email}. "
                           f"Status: {response.status_code}, Response: {response.text}")
                return False
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error sending notification '{notification_type}' to {user_email}: {str(e)}")
            return False
        except Exception as e:
            logger.error(f"Unexpected error sending notification '{notification_type}' to {user_email}: {str(e)}")
            return False
    
    def send_account_locked_notification(self, user, failed_attempts: int = None, 
                                       lockout_duration: str = "15 minutes", 
                                       ip_address: str = None, user_agent: str = None) -> bool:
        """Send account locked notification"""
        context_data = {
            'failed_attempts': failed_attempts or 'multiple',
            'lockout_duration': lockout_duration,
        }
        
        return self.send_notification(
            user_id=user.id,
            user_email=user.email,
            user_name=user.get_full_name() or user.username or user.email.split('@')[0],
            notification_type='account_locked',
            context_data=context_data,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    def send_account_unlocked_notification(self, user, ip_address: str = None, 
                                         user_agent: str = None) -> bool:
        """Send account unlocked notification"""
        return self.send_notification(
            user_id=user.id,
            user_email=user.email,
            user_name=user.get_full_name() or user.username or user.email.split('@')[0],
            notification_type='account_unlocked',
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    def send_failed_login_notification(self, user, ip_address: str = None, 
                                     user_agent: str = None) -> bool:
        """Send failed login attempt notification"""
        context_data = {
            'ip_address': ip_address or 'Unknown',
        }
        
        return self.send_notification(
            user_id=user.id,
            user_email=user.email,
            user_name=user.get_full_name() or user.username or user.email.split('@')[0],
            notification_type='failed_login_attempt',
            context_data=context_data,
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    def send_password_reset_notification(self, user, ip_address: str = None, 
                                       user_agent: str = None) -> bool:
        """Send password reset notification"""
        return self.send_notification(
            user_id=user.id,
            user_email=user.email,
            user_name=user.get_full_name() or user.username or user.email.split('@')[0],
            notification_type='password_reset',
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    def get_notification_history(self, user_id: str = None, user_email: str = None, 
                               notification_type: str = None, limit: int = 50) -> Optional[Dict]:
        """
        Get notification history for a user
        """
        if not self.enabled:
            return None
            
        try:
            params = {}
            if user_id:
                params['user_id'] = user_id
            if user_email:
                params['user_email'] = user_email
            if notification_type:
                params['notification_type'] = notification_type
            if limit:
                params['limit'] = limit
            
            response = requests.get(
                f"{self.base_url}/api/v1/history/",
                params=params,
                timeout=self.timeout
            )
            
            if response.status_code == 200:
                return response.json()
            else:
                logger.error(f"Failed to get notification history. Status: {response.status_code}")
                return None
                
        except requests.exceptions.RequestException as e:
            logger.error(f"Network error getting notification history: {str(e)}")
            return None
        except Exception as e:
            logger.error(f"Unexpected error getting notification history: {str(e)}")
            return None
    
    def health_check(self) -> bool:
        """
        Check if the notification service is healthy
        """
        try:
            response = requests.get(
                f"{self.base_url}/api/v1/health/",
                timeout=5
            )
            return response.status_code == 200
        except:
            return False


# Global instance
notification_client = NotificationClient()