# Railway Storage Configuration for Media Files

Railway doesn't have persistent storage by default. Here are the solutions:

## Solution 1: Railway Volumes (Recommended)

1. In your Railway dashboard:
   - Go to your backend service
   - Click on "Settings"
   - Scroll down to "Volumes"
   - Add a new volume:
     - Mount Path: `/app/media`
     - Size: 1GB (or as needed)

2. Update your settings.py to use the volume path in production:

```python
# In settings.py
if not DEBUG:  # Production
    MEDIA_ROOT = '/app/media'
else:  # Development
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

## Solution 2: Cloud Storage (AWS S3, Cloudinary, etc.)

For production apps, it's better to use cloud storage. Here's how to set up Cloudinary:

1. Install cloudinary:
```bash
pip install cloudinary
pip install django-cloudinary-storage
```

2. Add to settings.py:
```python
INSTALLED_APPS = [
    # ... other apps
    'cloudinary_storage',
    'cloudinary',
]

# Cloudinary settings
CLOUDINARY_STORAGE = {
    'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME'),
    'API_KEY': os.environ.get('CLOUDINARY_API_KEY'),
    'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET'),
}

if not DEBUG:
    DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
```

3. Add environment variables to Railway:
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY  
- CLOUDINARY_API_SECRET

## Quick Fix for Testing

For now, let's try the Railway volume approach.
