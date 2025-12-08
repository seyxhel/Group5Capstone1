"""
CAPTCHA service for login security.
Generates and validates CAPTCHA images to prevent brute-force attacks.
"""

import random
import string
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import base64
import hashlib
import time
from django.core.cache import cache
from django.conf import settings

class CaptchaService:
    """Service for generating and validating CAPTCHA challenges."""
    
    # Configuration
    CAPTCHA_LENGTH = 6
    CAPTCHA_WIDTH = 200
    CAPTCHA_HEIGHT = 60
    CAPTCHA_TIMEOUT = 600  # 10 minutes
    FAILED_ATTEMPTS_THRESHOLD = 3
    CACHE_PREFIX = 'captcha_'
    FAILED_ATTEMPTS_PREFIX = 'failed_login_'
    
    @classmethod
    def generate_captcha_text(cls, length=None):
        """Generate random CAPTCHA text."""
        if length is None:
            length = cls.CAPTCHA_LENGTH
        # Use digits and uppercase letters (excluding similar looking ones like 0/O, 1/I, etc.)
        chars = 'ACDEFGHJKLMNPQRUVWXYZ23456789'
        return ''.join(random.choice(chars) for _ in range(length))
    
    @classmethod
    def generate_captcha_image(cls, captcha_text):
        """Generate a CAPTCHA image from text."""
        # Create image
        img = Image.new('RGB', (cls.CAPTCHA_WIDTH, cls.CAPTCHA_HEIGHT), color='white')
        draw = ImageDraw.Draw(img)
        
        # Add some distortion and lines
        for _ in range(random.randint(3, 5)):
            x1 = random.randint(0, cls.CAPTCHA_WIDTH)
            y1 = random.randint(0, cls.CAPTCHA_HEIGHT)
            x2 = random.randint(0, cls.CAPTCHA_WIDTH)
            y2 = random.randint(0, cls.CAPTCHA_HEIGHT)
            draw.line([(x1, y1), (x2, y2)], fill='lightgray', width=1)
        
        # Try to use a system font, fallback to default
        try:
            # Try common font locations
            font_paths = [
                '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',  # Linux
                'C:\\Windows\\Fonts\\arial.ttf',  # Windows
                '/System/Library/Fonts/Helvetica.ttc',  # macOS
            ]
            font = None
            for font_path in font_paths:
                try:
                    font = ImageFont.truetype(font_path, 40)
                    break
                except:
                    continue
            if font is None:
                font = ImageFont.load_default()
        except:
            font = ImageFont.load_default()
        
        # Draw text with some randomness in position
        text_x = random.randint(15, 25)
        text_y = random.randint(10, 15)
        
        # Draw text with slight rotation/distortion effect by drawing multiple times with offsets
        draw.text((text_x, text_y), captcha_text, font=font, fill='black')
        
        # Add noise dots
        for _ in range(random.randint(20, 40)):
            x = random.randint(0, cls.CAPTCHA_WIDTH)
            y = random.randint(0, cls.CAPTCHA_HEIGHT)
            draw.point((x, y), fill='gray')
        
        return img
    
    @classmethod
    def generate(cls, session_id):
        """Generate and store a new CAPTCHA."""
        captcha_text = cls.generate_captcha_text()
        img = cls.generate_captcha_image(captcha_text)
        
        # Convert image to base64
        img_io = BytesIO()
        img.save(img_io, 'PNG')
        img_io.seek(0)
        img_base64 = base64.b64encode(img_io.getvalue()).decode('utf-8')
        
        # Hash the captcha text for secure storage
        captcha_hash = hashlib.sha256(captcha_text.encode()).hexdigest()
        
        # Store in cache with timeout
        cache_key = f"{cls.CACHE_PREFIX}{session_id}"
        cache.set(cache_key, captcha_hash, cls.CAPTCHA_TIMEOUT)
        
        return {
            'image': f'data:image/png;base64,{img_base64}',
            'session_id': session_id,
        }
    
    @classmethod
    def verify(cls, session_id, captcha_response):
        """Verify a CAPTCHA response."""
        if not captcha_response:
            return False
        
        cache_key = f"{cls.CACHE_PREFIX}{session_id}"
        stored_hash = cache.get(cache_key)
        
        if not stored_hash:
            return False
        
        # Hash the user's response and compare
        response_hash = hashlib.sha256(captcha_response.upper().encode()).hexdigest()
        return response_hash == stored_hash
    
    @classmethod
    def clear_captcha(cls, session_id):
        """Clear a CAPTCHA from cache."""
        cache_key = f"{cls.CACHE_PREFIX}{session_id}"
        cache.delete(cache_key)
    
    @classmethod
    def record_failed_attempt(cls, email):
        """Record a failed login attempt for an email."""
        cache_key = f"{cls.FAILED_ATTEMPTS_PREFIX}{email}"
        attempts = cache.get(cache_key, 0)
        cache.set(cache_key, attempts + 1, 3600)  # 1 hour expiry
        return attempts + 1
    
    @classmethod
    def get_failed_attempts(cls, email):
        """Get the number of failed login attempts for an email."""
        cache_key = f"{cls.FAILED_ATTEMPTS_PREFIX}{email}"
        return cache.get(cache_key, 0)
    
    @classmethod
    def should_require_captcha(cls, email):
        """Check if CAPTCHA should be required based on failed attempts."""
        attempts = cls.get_failed_attempts(email)
        return attempts >= cls.FAILED_ATTEMPTS_THRESHOLD
    
    @classmethod
    def clear_failed_attempts(cls, email):
        """Clear failed attempts for an email (on successful login)."""
        cache_key = f"{cls.FAILED_ATTEMPTS_PREFIX}{email}"
        cache.delete(cache_key)
