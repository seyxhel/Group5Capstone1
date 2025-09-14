# Fixing Image Storage and PDF Display Issues

## Issue 1: Images Not Saving/Showing After Redeployment

### Problem:
Railway doesn't have persistent storage by default. When you redeploy, all uploaded files are lost.

### Solution 1: Railway Volumes (Quick Fix)

1. **In Railway Dashboard:**
   - Go to your backend service
   - Click "Settings"
   - Scroll to "Volumes" section
   - Add new volume:
     - **Mount Path:** `/app/media`
     - **Size:** 1GB (adjust as needed)

2. **Environment Variable (Optional):**
   Add to Railway environment variables:
   ```
   MEDIA_ROOT=/app/media
   ```

### Solution 2: Cloud Storage (Production Recommended)

For a production app, use cloud storage like Cloudinary:

1. **Install packages:**
   ```bash
   pip install cloudinary django-cloudinary-storage
   ```

2. **Update requirements.txt:**
   ```
   cloudinary
   django-cloudinary-storage
   ```

3. **Add to settings.py:**
   ```python
   INSTALLED_APPS = [
       # ... existing apps
       'cloudinary_storage',
       'cloudinary',
   ]

   CLOUDINARY_STORAGE = {
       'CLOUD_NAME': os.environ.get('CLOUDINARY_CLOUD_NAME'),
       'API_KEY': os.environ.get('CLOUDINARY_API_KEY'),
       'API_SECRET': os.environ.get('CLOUDINARY_API_SECRET'),
   }

   if not DEBUG:
       DEFAULT_FILE_STORAGE = 'cloudinary_storage.storage.MediaCloudinaryStorage'
   ```

4. **Add Railway environment variables:**
   - `CLOUDINARY_CLOUD_NAME`
   - `CLOUDINARY_API_KEY`
   - `CLOUDINARY_API_SECRET`

## Issue 2: PDF Should Display Inline (Not Download)

### Problem:
PDFs were being forced to download instead of displaying in browser.

### Solution:
Updated the Content-Disposition logic to only force downloads for:
- Word documents (.docx, .doc)
- Excel files (.xlsx, .xls)
- CSV files (.csv)

PDFs, images, and other viewable content now display inline.

## Changes Made:

### 1. Updated settings.py:
```python
# Dynamic media root based on environment
if DEBUG:
    MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
else:
    MEDIA_ROOT = os.environ.get('MEDIA_ROOT', '/app/media')
```

### 2. Updated secure_media.py:
```python
# Only force download for office documents and CSV
download_types = [
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",       # .xlsx
    "application/msword",  # .doc
    "application/vnd.ms-excel",  # .xls
    "text/csv"
]
download_extensions = [".docx", ".xlsx", ".csv", ".doc", ".xls"]

if content_type in download_types or file_ext in download_extensions:
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
else:
    # Display inline for images, PDFs, and other viewable content
    response["Content-Disposition"] = f'inline; filename="{filename}"'
```

### 3. Updated Dockerfile:
```dockerfile
# Create media directory for file uploads
RUN mkdir -p /app/media/employee_images /app/media/ticket_attachments
```

### 4. Updated entrypoint.sh:
```bash
echo "Creating media directories..."
mkdir -p /app/media/employee_images
mkdir -p /app/media/ticket_attachments
chmod 755 /app/media
chmod 755 /app/media/employee_images
chmod 755 /app/media/ticket_attachments
```

## Deployment Steps:

1. **Set up Railway Volume:**
   - Go to Railway dashboard
   - Add volume with mount path `/app/media`

2. **Deploy the updated code:**
   - Commit and push changes
   - Railway will auto-deploy

3. **Test the fixes:**
   - Upload new images (should persist after redeployment)
   - Test PDF files (should display inline, not download)
   - Test office documents (should still download)

## File Behavior After Fix:

| File Type | Behavior |
|-----------|----------|
| Images (JPG, PNG, GIF) | Display inline |
| PDFs | Display inline |
| Word documents | Download |
| Excel files | Download |
| CSV files | Download |

## Testing Checklist:

- [ ] Images upload and display correctly
- [ ] Images persist after redeployment
- [ ] PDFs display in browser (not download)
- [ ] Word/Excel files still download
- [ ] Secure media authentication still works
