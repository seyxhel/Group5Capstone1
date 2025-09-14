# Testing Secure Media Implementation on Railway Deployment

## Prerequisites
1. Your app is deployed on Railway: `https://smartsupport-hdts-backend.up.railway.app`
2. You have some existing ticket attachments and employee images
3. You have access to browser developer tools

## Test 1: Verify Unauthenticated Access is Blocked

### Step 1: Find an existing media URL
1. Log into your frontend app
2. Go to a ticket that has attachments
3. Right-click on an attachment link and copy the URL
4. It should look like: `https://smartsupport-hdts-backend.up.railway.app/media/ticket_attachments/some-file.pdf?token=eyJ...`

### Step 2: Test without authentication
1. Open a new incognito/private browser window
2. Remove the `?token=...` part from the URL
3. Try to access: `https://smartsupport-hdts-backend.up.railway.app/media/ticket_attachments/some-file.pdf`
4. **Expected Result**: You should get a 403 Forbidden or "Authentication required" error

## Test 2: Verify Authenticated Access Works

### Step 1: Test through the frontend
1. Log into your application normally
2. Navigate to employee profiles - images should load correctly
3. Navigate to tickets with attachments - files should be accessible
4. Try downloading attachments - should work normally

### Step 2: Check URLs in developer tools
1. Open browser developer tools (F12)
2. Go to Network tab
3. Navigate to a ticket with attachments
4. Look at the media requests - they should include `?token=...` parameters
5. **Expected Result**: All media requests should return 200 OK

## Test 3: Test API Key Access (External System Simulation)

### Step 1: Get your external API key
1. Check your Railway environment variables for `EXTERNAL_SYSTEM_API_KEY`
2. Or use the one from your `.env` file

### Step 2: Test API key access
1. Take a media URL (without any token)
2. Add your API key: `https://smartsupport-hdts-backend.up.railway.app/media/ticket_attachments/some-file.pdf?api_key=YOUR_API_KEY`
3. **Expected Result**: File should be accessible with valid API key

## Test 4: Verify Cross-User Permission Control

### Step 1: Create test scenario
1. Log in as Employee A
2. Create a ticket with an attachment
3. Note the attachment URL

### Step 2: Test with different user
1. Log in as Employee B (different employee)
2. Try to access Employee A's ticket attachment URL
3. **Expected Result**: Should be blocked unless Employee B is admin/coordinator

## Test 5: Test Different File Types

### Test with different file types:
1. **Images** (JPG, PNG): Should display inline
2. **Documents** (PDF, DOCX): Should download or display based on type
3. **Spreadsheets** (XLSX, CSV): Should download

## Test 6: Monitor Server Logs

### If you have access to Railway logs:
1. Go to your Railway dashboard
2. Check the deployment logs
3. Look for media access attempts
4. You should see authentication success/failure messages

## Test 7: API Response Verification

### Step 1: Check API responses include secure URLs
```bash
# Test with curl (replace with your actual token)
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://smartsupport-hdts-backend.up.railway.app/api/tickets/

# Check that attachment URLs include token parameters
```

### Step 2: Verify employee profile API
```bash
curl -H "Authorization: Bearer YOUR_JWT_TOKEN" \
     https://smartsupport-hdts-backend.up.railway.app/api/employee/profile/

# Check that image URL includes token parameter
```

## Quick Browser Tests

### Test 1: Unauthenticated Access
```
https://smartsupport-hdts-backend.up.railway.app/media/employee_images/some-image.jpg
```
**Expected**: 403 Forbidden

### Test 2: With Valid Token
```
https://smartsupport-hdts-backend.up.railway.app/media/employee_images/some-image.jpg?token=VALID_JWT_TOKEN
```
**Expected**: Image loads

### Test 3: With API Key
```
https://smartsupport-hdts-backend.up.railway.app/media/ticket_attachments/some-file.pdf?api_key=YOUR_API_KEY
```
**Expected**: File downloads/displays

### Test 4: Invalid Credentials
```
https://smartsupport-hdts-backend.up.railway.app/media/ticket_attachments/some-file.pdf?token=invalid_token
```
**Expected**: 403 Forbidden

## Automated Test Script

Save this as `test_secure_media.py` and run it:

```python
import requests
import json

# Configuration
BASE_URL = "https://smartsupport-hdts-backend.up.railway.app"
LOGIN_URL = f"{BASE_URL}/api/token/employee/"
PROFILE_URL = f"{BASE_URL}/api/employee/profile/"

# Test credentials (use your actual test employee credentials)
TEST_EMAIL = "test@example.com"
TEST_PASSWORD = "testpassword"

def test_secure_media():
    # 1. Login to get token
    login_data = {"email": TEST_EMAIL, "password": TEST_PASSWORD}
    response = requests.post(LOGIN_URL, json=login_data)
    
    if response.status_code != 200:
        print("❌ Login failed")
        return
    
    token = response.json()["access"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 2. Get profile to check secure image URL
    profile_response = requests.get(PROFILE_URL, headers=headers)
    if profile_response.status_code == 200:
        profile_data = profile_response.json()
        image_url = profile_data.get("image")
        
        if image_url and "token=" in image_url:
            print("✅ Profile image URL includes token")
            
            # Test image access
            img_response = requests.get(image_url)
            if img_response.status_code == 200:
                print("✅ Secure image access works")
            else:
                print("❌ Secure image access failed")
        else:
            print("⚠️ Profile image URL doesn't include token")
    
    # 3. Test unauthenticated access
    if image_url:
        public_url = image_url.split("?")[0]  # Remove token
        public_response = requests.get(public_url)
        if public_response.status_code == 403:
            print("✅ Unauthenticated access blocked")
        else:
            print("❌ Unauthenticated access allowed (security issue!)")

if __name__ == "__main__":
    test_secure_media()
```

## Expected Results Summary

| Test | Expected Result |
|------|----------------|
| Unauthenticated access | 403 Forbidden |
| Valid JWT token | 200 OK |
| Valid API key | 200 OK |
| Invalid token | 403 Forbidden |
| Cross-user access | 403 Forbidden (unless admin) |
| Frontend usage | Works normally |

## Troubleshooting

### If tests fail:

1. **Check environment variables**: Ensure `EXTERNAL_SYSTEM_API_KEY` is set
2. **Check deployment**: Verify the secure media implementation is deployed
3. **Check logs**: Look at Railway logs for error messages
4. **Check settings**: Ensure `DEBUG=False` in production
5. **Check file paths**: Verify media files exist on the server

### Common issues:

- **CORS errors**: Check CORS settings in Django
- **Token expiration**: JWT tokens expire, get fresh ones
- **File not found**: Ensure media files are properly uploaded
- **Permission denied**: Check user roles and permissions
