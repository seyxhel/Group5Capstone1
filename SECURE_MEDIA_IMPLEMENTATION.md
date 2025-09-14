# Secure Media Access Implementation

## Overview
This implementation secures media file access (employee images and ticket attachments) so that only authenticated users can access them. The system uses JWT tokens for authentication and authorization.

## What was implemented:

### 1. Backend Changes

#### Secure Media View (`core/secure_media.py`)
- `serve_secure_media()`: Main view that serves media files with authentication checks
- `authenticate_token_from_query()`: Allows authentication via URL token parameter
- `has_file_permission()`: Checks user permissions for specific files
- `secure_attachment_download()`: Direct download endpoint for attachments

#### Media Utils (`core/media_utils.py`)
- `generate_secure_media_url()`: Creates secure URLs with embedded tokens
- `get_media_url_with_token()`: Helper for Django FileFields

#### Updated URL Configuration (`backend/urls.py`)
- Routes all `/media/` requests through the secure view in production
- Maintains direct file serving in development mode

#### Updated Serializers (`core/serializers.py`)
- `TicketAttachmentSerializer`: Returns secure URLs with tokens
- `EmployeeSerializer`: Returns secure URLs for profile images
- `EmployeeInfoSerializer`: Returns secure URLs for employee images

### 2. Frontend Utilities

#### Secure Media Utilities (`utilities/secureMedia.js`)
- Functions to handle secure media URLs
- Token management and URL generation
- Secure file download functionality

## Access Control Rules

### Employee Profile Images (`employee_images/`)
- **System Admins & Ticket Coordinators**: Full access to all images
- **Employees**: Can access their own image + view other employees' images (for team visibility)
- **External Systems**: Access with valid API key

### Ticket Attachments (`ticket_attachments/`)
- **System Admins & Ticket Coordinators**: Full access to all attachments
- **Employees**: Can only access attachments from:
  - Tickets they created
  - Tickets assigned to them
- **External Systems**: Access with valid API key

## How Authentication Works

1. **In Production**:
   - **For Users**: `/media/<file_path>?token=<jwt_token>`
   - **For External Systems**: `/media/<file_path>?api_key=<external_api_key>`
   - The secure view validates either JWT token or API key
   - Checks user permissions for the specific file (bypassed for valid API key)
   - Serves the file if authorized, returns 403 if not

2. **In Development**:
   - Media files are served directly (for easier development)
   - Authentication is handled by API endpoints

## External System Integration

### For External Systems (like Workflow API)
External systems receive URLs with embedded API keys that allow them to access attachments:

```json
{
  "attachments": [
    {
      "file": "https://smartsupport-hdts-backend.up.railway.app/media/ticket_attachments/file.pdf?api_key=your-external-api-key"
    }
  ]
}
```

### Configuration
Set the `EXTERNAL_SYSTEM_API_KEY` environment variable with a secure API key that external systems will use to access media files.

### Security for External Systems
- External systems use a shared API key for media access
- The API key should be kept secure and rotated periodically
- External systems bypass user-level permissions but still go through the secure media endpoint
- All access is logged for audit purposes

## Testing the Implementation

### 1. Test Unauthenticated Access
Try accessing a media file without authentication:
```
https://smartsupport-hdts-backend.up.railway.app/media/ticket_attachments/some_file.pdf
```
**Expected**: 403 Forbidden or authentication required error

### 2. Test Authenticated Access
Access through the frontend when logged in:
- View employee profiles (images should load)
- View ticket details (attachments should be accessible)
- Try downloading attachments

### 3. Test Cross-User Access
- Employee A tries to access Employee B's ticket attachments
- **Expected**: Should be blocked unless Employee A is admin/coordinator

### 4. Test External System Access
Try accessing with API key:
```
https://smartsupport-hdts-backend.up.railway.app/media/ticket_attachments/file.pdf?api_key=your-external-api-key
```
**Expected**: Should work with valid API key, fail with invalid key

### 5. Verify Token-Based URLs
Check that API responses include properly formatted secure URLs:
```json
{
  "attachments": [
    {
      "file": "https://smartsupport-hdts-backend.up.railway.app/media/ticket_attachments/file.pdf?token=eyJ..."
    }
  ]
}
```

### 6. Verify External System URLs
Check that Celery tasks send URLs with API keys:
```json
{
  "attachments": [
    {
      "file": "https://smartsupport-hdts-backend.up.railway.app/media/ticket_attachments/file.pdf?api_key=external-key"
    }
  ]
}
```

## Security Features

1. **JWT Token Validation**: All requests must include valid JWT tokens
2. **Path Traversal Protection**: Ensures files are within MEDIA_ROOT
3. **Permission-Based Access**: Users can only access files they're authorized for
4. **CORS Headers**: Proper headers for frontend access
5. **File Type Handling**: Appropriate Content-Disposition headers

## Deployment Notes

- Media files are now protected in production
- Frontend components automatically receive secure URLs
- Tokens are embedded in URLs for seamless access
- File downloads work through authenticated requests

## Backwards Compatibility

- Development mode still serves files directly
- Frontend components work without modification
- API endpoints return complete URLs ready for use
