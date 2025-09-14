# Quick Manual Testing Checklist for Secure Media

## ✅ Pre-deployment Checklist

- [ ] Environment variable `EXTERNAL_SYSTEM_API_KEY` is set on Railway
- [ ] Code is deployed to Railway
- [ ] Application is running without errors

## 🧪 Manual Tests (5 minutes)

### Test 1: Frontend Still Works ✅
1. Log into your frontend application
2. Navigate to employee profiles
3. Check if profile images load correctly
4. Navigate to tickets with attachments
5. Check if attachment links work

**Expected**: Everything works normally

### Test 2: Direct URL Access is Blocked 🚫
1. While logged in, right-click an attachment link
2. Copy the URL (should look like: `https://smartsupport-hdts-backend.up.railway.app/media/ticket_attachments/file.pdf?token=...`)
3. Remove the `?token=...` part
4. Open the shortened URL in a new incognito window
5. Try to access: `https://smartsupport-hdts-backend.up.railway.app/media/ticket_attachments/file.pdf`

**Expected**: 403 Forbidden or authentication error

### Test 3: API Key Access Works 🔑
1. Get your `EXTERNAL_SYSTEM_API_KEY` from Railway environment variables
2. Take the same URL from Test 2
3. Add your API key: `https://smartsupport-hdts-backend.up.railway.app/media/ticket_attachments/file.pdf?api_key=YOUR_API_KEY`
4. Access this URL

**Expected**: File should download/display

### Test 4: Check Developer Tools 🔍
1. Open your frontend application
2. Open browser developer tools (F12)
3. Go to Network tab
4. Navigate to a page with images/attachments
5. Look at the media requests

**Expected**: All media URLs should include `?token=...` parameters

### Test 5: Cross-User Access (If you have multiple test accounts) 👥
1. Log in as Employee A
2. Create/find a ticket with attachments
3. Copy an attachment URL
4. Log in as Employee B
5. Try to access Employee A's attachment URL

**Expected**: Should be blocked unless Employee B is admin/coordinator

## 🚨 What to Look For

### ✅ Good Signs:
- Frontend works normally
- Direct media URLs are blocked
- API key access works
- Media URLs include tokens
- Different users can't access each other's files

### ❌ Bad Signs:
- Direct media URLs work without authentication
- Media URLs don't include tokens
- Any user can access any file
- 500 server errors

## 📞 Quick Test URLs

Replace `YOUR_DOMAIN` with your actual Railway URL:

### Should be BLOCKED:
```
https://YOUR_DOMAIN/media/employee_images/some-image.jpg
https://YOUR_DOMAIN/media/ticket_attachments/some-file.pdf
```

### Should WORK (with valid token):
```
https://YOUR_DOMAIN/media/employee_images/some-image.jpg?token=VALID_JWT_TOKEN
```

### Should WORK (with valid API key):
```
https://YOUR_DOMAIN/media/ticket_attachments/some-file.pdf?api_key=YOUR_API_KEY
```

## 🛠️ If Something's Wrong

1. **Check Railway logs** for errors
2. **Verify environment variables** are set
3. **Check if DEBUG=False** in production
4. **Restart the Railway service**
5. **Review the code changes** were deployed

## 📱 Mobile/Different Browser Test

Test on different devices/browsers to ensure:
- Images load on mobile
- Downloads work on different browsers
- Authentication works across platforms

---

**Total time needed: ~5-10 minutes for basic verification**
