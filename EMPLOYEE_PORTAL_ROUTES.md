## Employee Portal - Complete Template and API Route Summary

### Template Routes (Direct Access)

**Root Level (Direct shortcuts for convenience):**
- `GET /employee-login/` → Login form template
- `GET /register/` → Registration form template
- `GET /api/v1/employees/login-ui/` → Alternative login form route
- `GET /api/v1/employees/verify-otp/` → OTP verification form
- `GET /api/v1/employees/profile-settings/` → Profile management form

**Nested in HDTS (Full path):**
- `GET /api/v1/hdts/employees/login-ui/` → Login form
- `GET /api/v1/hdts/employees/verify-otp/` → OTP verification form
- `GET /api/v1/hdts/employees/profile-settings/` → Profile settings form
- `GET /api/v1/hdts/employees/dashboard/` → Dashboard
- `GET /api/v1/hdts/employees/logout/` → Logout (clears cookies)

---

### API Routes (JSON Responses)

**Authentication (Token-based):**
- `POST /api/v1/employees/register/` → Create new employee account
- `POST /api/v1/employees/login/` → Login with email/password (returns JWT tokens in response + sets cookies)
- `POST /api/v1/employees/token/refresh/` → Refresh access token using refresh token
- `POST /api/v1/employees/logout/` → Logout API endpoint

**Profile Management:**
- `GET /api/v1/employees/profile/` → Get employee profile (requires auth)
- `PUT /api/v1/employees/profile/` → Update employee profile (requires auth)
- `PATCH /api/v1/employees/profile/` → Partial update of profile (requires auth)

**Password Management:**
- `POST /api/v1/employees/profile/change-password/` → Change password (requires auth)

**Two-Factor Authentication:**
- `POST /api/v1/employees/2fa/request-otp/` → Request OTP via email (requires auth)
- `POST /api/v1/employees/2fa/verify-otp/` → Verify OTP code (requires auth)
- `POST /api/v1/employees/2fa/enable/` → Enable 2FA (requires auth)
- `POST /api/v1/employees/2fa/disable/` → Disable 2FA (requires auth)

**Root Discovery:**
- `GET /api/v1/employees/` → API root showing all available endpoints

---

### Template Authentication Flow

#### Login Flow (Without 2FA)
1. User visits `/employee-login/` (template form)
2. Submits email + password via POST
3. `EmployeeLoginView.post()` validates credentials
4. On success:
   - Generates JWT tokens manually (no User model dependency)
   - Sets secure httponly cookies (`access_token`, `refresh_token`)
   - Redirects to `/api/v1/employees/dashboard/` (or `hdts:employee-dashboard`)

#### Login Flow (With 2FA)
1. User visits `/employee-login/` (template form)
2. Submits email + password via POST
3. `EmployeeLoginView.post()` validates credentials
4. If 2FA enabled:
   - Stores `otp_email` in session
   - Sets `otp_pending` session flag
   - Redirects to `/api/v1/employees/verify-otp/`
5. User enters OTP from email
6. `EmployeeVerifyOTPView.post()` verifies OTP
7. On success:
   - Clears OTP session data
   - Generates JWT tokens
   - Sets secure cookies
   - Redirects to dashboard

#### API Login Flow
1. POST to `/api/v1/employees/login/` with `{"email": "...", "password": "..."}`
2. Response includes:
   ```json
   {
     "access": "jwt_token_here",
     "refresh": "refresh_token_here",
     "employee": {
       "id": 1,
       "email": "john.doe@example.com",
       "first_name": "John",
       ...
     }
   }
   ```
3. Cookies automatically set in response headers:
   - `access_token` (15 mins, httponly, secure, sameSite=Strict)
   - `refresh_token` (7 days, httponly, secure, sameSite=Strict)

---

### Token Generation (Both Template & API)

**Manual JWT Creation** (No Django User Model):
- Uses `jwt.encode()` directly
- Payload includes:
  - `employee_id`: Employee ID
  - `email`: Employee email
  - `first_name`, `last_name`: Name fields
  - `company_id`: Company ID
  - `token_type`: 'access' or 'refresh'
  - `exp`: Expiration timestamp
  - `iat`: Issued at timestamp

**Token Expiration:**
- Access tokens: 15 minutes
- Refresh tokens: 7 days

---

### Available Templates

1. **employee_login.html** - Login form with email/password fields
2. **employee_verify_otp.html** - OTP verification form (6-digit code)
3. **employee_profile.html** - Profile view/edit (currently referenced, may need completion)
4. **employee_change_password.html** - Password change form
5. **employee_dashboard.html** - Main dashboard after login (NEW)

---

### Authentication Mechanism

**Middleware Integration:**
- `JWTAuthenticationMiddleware` in `middleware.py`
- Extracts JWT from `access_token` cookie
- Verifies token signature
- Attaches `request.employee` object (Employees instance)

**Template View Auth Check:**
```python
access_token = request.COOKIES.get('access_token')
# Verify and decode token
payload = jwt.decode(access_token, secret, algorithms=[algorithm])
employee = Employees.objects.get(id=payload['employee_id'])
```

---

### Security Features

✅ **Secure Cookies:**
- `httponly=True` - JavaScript cannot access
- `secure=True` - HTTPS only
- `samesite=Strict` - CSRF protection

✅ **Account Lockout:**
- 5 failed login attempts → 30-minute lockout
- Tracked in `Employees.failed_login_attempts` and `Employees.lockout_time`

✅ **2FA Protection:**
- Email-based OTP (6 digits)
- 5-minute expiration
- 3 maximum verification attempts
- Auto-invalidation of old unused OTPs

✅ **Password Hashing:**
- Django's `make_password()` / `check_password()`
- Uses PBKDF2 by default

---

### Database Models

**Employees:**
- `id`, `email`, `username`, `password` (hashed)
- `first_name`, `middle_name`, `last_name`, `suffix`
- `phone_number`, `company_id`, `department`, `status`
- `otp_enabled` (boolean)
- `failed_login_attempts`, `is_locked`, `lockout_time`
- `last_login`, `created_at`, `updated_at`

**EmployeeOTP:**
- `id`, `employee` (FK)
- `otp_code` (6 digits)
- `created_at`, `expires_at` (5 min from creation)
- `attempted_count`, `is_verified`
- Methods: `generate_for_employee()`, `verify()`, `get_valid_otp_for_employee()`

---

### Example Usage

**Template Login:**
```bash
curl -X POST http://localhost:8003/employee-login/ \
  -d "email=john.doe@example.com&password=TestPassword123!"
# Result: Redirect to /api/v1/employees/dashboard/ with cookies set
```

**API Login:**
```bash
curl -X POST http://localhost:8003/api/v1/employees/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"john.doe@example.com","password":"TestPassword123!"}'
# Result: JSON with tokens + cookies set
```

**Authenticated Request (Using Cookie):**
```bash
curl http://localhost:8003/api/v1/employees/profile/ \
  -H "Cookie: access_token=<token_here>"
# Result: Employee profile JSON
```

**Refresh Token:**
```bash
curl -X POST http://localhost:8003/api/v1/employees/token/refresh/ \
  -H "Content-Type: application/json" \
  -d '{"refresh":"<refresh_token_here>"}'
# Result: New access token
```

---

### Namespace References for Django Templates

Use these in template `{% url %}` tags:
- `hdts:employee-login` → `/api/v1/hdts/employees/login-ui/`
- `hdts:employee-login-api` → `/api/v1/hdts/employees/login/` (API)
- `hdts:employee-register` → `/api/v1/hdts/employees/register/` (API)
- `hdts:employee-dashboard` → `/api/v1/hdts/employees/dashboard/`
- `hdts:employee-profile-settings` → `/api/v1/hdts/employees/profile-settings/`
- `hdts:employee-logout` → `/api/v1/hdts/employees/logout/`
- `hdts:employee-verify-otp` → `/api/v1/hdts/employees/verify-otp/`

---

### Configuration Required

**Django Settings:**
- `SIMPLE_JWT` configured with ALGORITHM (default: HS256)
- Middleware includes `middleware.JWTAuthenticationMiddleware`
- Templates directory includes `hdts/` subdirectory
- Notification client configured for OTP emails

**Email Configuration:**
- SMTP server configured for sending OTP codes
- Notification client working and accessible

---

### Testing Credentials (From seed_employees.py)

```
Email: john.doe@example.com
Password: TestPassword123!
2FA: Disabled

Email: robert.johnson@example.com
Password: TestPassword123!
2FA: Enabled (will receive OTP email on login)

(Plus 6 additional test employees)
```
