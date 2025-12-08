"""
Rate limiting and device fingerprinting utilities for login protection.
Implements IP-based and device-based rate limiting to prevent brute force attacks.
"""

import hashlib
import logging
from django.utils import timezone
from django.http import HttpRequest
from .models import IPAddressRateLimit, DeviceFingerprint, RateLimitConfig

logger = logging.getLogger(__name__)


def get_client_ip(request: HttpRequest) -> str:
    """
    Extract the real client IP address from request.
    Handles proxies and load balancers properly.
    """
    # Check for IP in X-Forwarded-For (common in proxies)
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # X-Forwarded-For can contain multiple IPs, take the first one
        ip = x_forwarded_for.split(',')[0].strip()
        return ip
    
    # Check for X-Real-IP (used by some proxies)
    x_real_ip = request.META.get('HTTP_X_REAL_IP')
    if x_real_ip:
        return x_real_ip
    
    # Fall back to REMOTE_ADDR (direct connection)
    return request.META.get('REMOTE_ADDR', '0.0.0.0')


def generate_device_fingerprint(request: HttpRequest) -> str:
    """
    Generate a device fingerprint from browser/device characteristics.
    Uses User-Agent, Accept-Language, and other HTTP headers.
    """
    components = [
        request.META.get('HTTP_USER_AGENT', ''),
        request.META.get('HTTP_ACCEPT_LANGUAGE', ''),
        request.META.get('HTTP_ACCEPT_ENCODING', ''),
        request.META.get('REMOTE_ADDR', ''),
    ]
    
    # Join components and create SHA256 hash
    fingerprint_str = '|'.join(components)
    fingerprint_hash = hashlib.sha256(fingerprint_str.encode()).hexdigest()
    
    return fingerprint_hash


def get_or_create_ip_rate_limit(ip_address: str, user_email: str = None) -> IPAddressRateLimit:
    """Get or create IP rate limit tracker for a specific IP and user email combination"""
    # If no email provided, use a default placeholder for backward compatibility
    if not user_email:
        user_email = "unknown@system.local"
    
    rate_limit, created = IPAddressRateLimit.objects.get_or_create(
        ip_address=ip_address,
        user_email=user_email
    )
    return rate_limit


def get_or_create_device_fingerprint(fingerprint_hash: str, user_email: str = None) -> DeviceFingerprint:
    """Get or create device fingerprint tracker for a specific device and user email combination"""
    # If no email provided, use a default placeholder for backward compatibility
    if not user_email:
        user_email = "unknown@system.local"
    
    fingerprint, created = DeviceFingerprint.objects.get_or_create(
        fingerprint_hash=fingerprint_hash,
        user_email=user_email
    )
    return fingerprint


def check_ip_rate_limit(request: HttpRequest, user_email: str = None) -> dict:
    """
    Check if IP has exceeded rate limit threshold for a specific user.
    
    Returns:
        {
            'allowed': bool,
            'reason': str,
            'blocked_until': datetime or None,
            'attempts': int
        }
    """
    config = RateLimitConfig.get_config()
    ip_address = get_client_ip(request)
    rate_limit = get_or_create_ip_rate_limit(ip_address, user_email)
    
    # Check if IP is blocked
    if rate_limit.is_blocked():
        return {
            'allowed': False,
            'reason': 'IP_BLOCKED',
            'blocked_until': rate_limit.blocked_until,
            'attempts': rate_limit.failed_attempts
        }
    
    # If block has expired but attempts are still high, reset them
    if rate_limit.blocked_until and timezone.now() >= rate_limit.blocked_until:
        rate_limit.reset_attempts()
    
    # Check if IP has exceeded threshold
    if rate_limit.failed_attempts >= config.ip_attempt_threshold:
        rate_limit.block_until(config.ip_block_duration_minutes)
        return {
            'allowed': False,
            'reason': 'IP_THRESHOLD_EXCEEDED',
            'blocked_until': rate_limit.blocked_until,
            'attempts': rate_limit.failed_attempts
        }
    
    return {
        'allowed': True,
        'reason': None,
        'blocked_until': None,
        'attempts': rate_limit.failed_attempts
    }


def check_device_rate_limit(request: HttpRequest, user_email: str = None) -> dict:
    """
    Check if device has exceeded rate limit thresholds for a specific user.
    
    Returns:
        {
            'allowed': bool,
            'requires_captcha': bool,
            'blocked_until': datetime or None,
            'attempts': int
        }
    """
    config = RateLimitConfig.get_config()
    fingerprint_hash = generate_device_fingerprint(request)
    device = get_or_create_device_fingerprint(fingerprint_hash, user_email)
    
    # Check if device is blocked
    if device.is_blocked():
        return {
            'allowed': False,
            'requires_captcha': True,
            'blocked_until': device.blocked_until,
            'attempts': device.failed_attempts
        }
    
    # If block has expired but attempts are still high, reset them
    if device.blocked_until and timezone.now() >= device.blocked_until:
        device.reset_attempts()
    
    # Check if device has exceeded block threshold
    if device.failed_attempts >= config.device_captcha_threshold:
        device.block_until(config.device_block_duration_minutes)
        return {
            'allowed': False,
            'requires_captcha': True,
            'blocked_until': device.blocked_until,
            'attempts': device.failed_attempts
        }
    
    # Check if device requires captcha (but not blocked)
    requires_captcha = device.failed_attempts >= config.device_attempt_threshold
    
    return {
        'allowed': True,
        'requires_captcha': requires_captcha,
        'blocked_until': None,
        'attempts': device.failed_attempts
    }


def check_login_rate_limits(request: HttpRequest, user_email: str = None) -> dict:
    """
    Check both IP and device rate limits for a specific user.
    Returns combined result indicating if login is allowed and if captcha is required.
    
    Returns:
        {
            'login_allowed': bool,
            'captcha_required': bool,
            'blocked_reason': str or None,
            'blocked_until': datetime or None
        }
    """
    ip_check = check_ip_rate_limit(request, user_email)
    device_check = check_device_rate_limit(request, user_email)
    
    # If IP is blocked, deny login completely
    if not ip_check['allowed']:
        return {
            'login_allowed': False,
            'captcha_required': True,
            'blocked_reason': ip_check['reason'],
            'blocked_until': ip_check['blocked_until']
        }
    
    # If device is blocked, deny login
    if not device_check['allowed']:
        return {
            'login_allowed': False,
            'captcha_required': True,
            'blocked_reason': 'DEVICE_BLOCKED',
            'blocked_until': device_check['blocked_until']
        }
    
    # Login allowed, but may require captcha
    return {
        'login_allowed': True,
        'captcha_required': device_check['requires_captcha'],
        'blocked_reason': None,
        'blocked_until': None
    }


def record_failed_login_attempt(request: HttpRequest, user_email: str = None, skip_for_otp_error: bool = False):
    """
    Record a failed login attempt for both IP and device for a specific user.
    
    Args:
        request: The HTTP request object
        user_email: The email of the user attempting to login
        skip_for_otp_error: If True, skip recording (used for invalid OTP attempts where credentials were valid)
    """
    if skip_for_otp_error:
        return
    
    ip_address = get_client_ip(request)
    fingerprint_hash = generate_device_fingerprint(request)
    
    # Increment IP attempt counter for this user
    ip_rate_limit = get_or_create_ip_rate_limit(ip_address, user_email)
    ip_rate_limit.increment_failed_attempts()
    
    # Increment device attempt counter for this user
    device = get_or_create_device_fingerprint(fingerprint_hash, user_email)
    device.increment_failed_attempts()
    
    logger.warning(
        f"Failed login attempt - IP: {ip_address}, Email: {user_email}, Device: {fingerprint_hash[:16]}..., "
        f"IP Attempts: {ip_rate_limit.failed_attempts}, Device Attempts: {device.failed_attempts}"
    )


def record_successful_login(request: HttpRequest, user_email: str = None):
    """
    Record a successful login and reset rate limits for the device/IP and user combination.
    """
    ip_address = get_client_ip(request)
    fingerprint_hash = generate_device_fingerprint(request)
    
    # Reset IP attempt counter for this user
    ip_rate_limit = get_or_create_ip_rate_limit(ip_address, user_email)
    ip_rate_limit.reset_attempts()
    
    # Reset device attempt counter for this user
    device = get_or_create_device_fingerprint(fingerprint_hash, user_email)
    device.reset_attempts()
    
    logger.info(
        f"Successful login - IP: {ip_address}, Email: {user_email}, Device: {fingerprint_hash[:16]}..."
    )
