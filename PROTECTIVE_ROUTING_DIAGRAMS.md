# Employee Portal Routing Flow Diagram

## Authentication Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         REQUEST ARRIVES                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│              JWTAuthenticationMiddleware                         │
│  • Extract token from cookies                                   │
│  • Decode JWT (employee or user)                               │
│  • Attach request.employee or request.user                     │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ Route Matching │
                    └────────┬───────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
        ▼                    ▼                    ▼
┌──────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│  Public Routes   │ │ Protected Routes │ │  Staff Routes    │
│  /login/         │ │ /profile-setting │ │  /staff/login/   │
│  /register/      │ │ /change-password │ │  /staff/agent-..│
│  /verify-otp/    │ │                  │ │                  │
│  /forgot-pwd/    │ │ Mixin:           │ │ (Staff auth)     │
│  /reset-pwd/     │ │ LoginRequired    │ │                  │
│                  │ │                  │ │                  │
│ Mixin:           │ │ Redirect:        │ │                  │
│ NotAuthenticated │ │ ❌ Not auth →    │ │                  │
│                  │ │ /login/          │ │                  │
│ Redirect:        │ │                  │ │                  │
│ ✓ Not auth →     │ │ ✓ Authenticated  │ │                  │
│ Show page        │ │ → Show page      │ │                  │
│                  │ │                  │ │                  │
│ ❌ Auth →        │ │                  │ │                  │
│ /profile-        │ │                  │ │                  │
│ settings/        │ │                  │ │                  │
└──────────────────┘ └──────────────────┘ └──────────────────┘
```

## Detailed Request Flow - Unauthenticated User

```
START: User visits /profile-settings/
  │
  ├─→ Middleware checks request
  │     └─→ No JWT token found
  │         request.employee = None
  │
  ├─→ EmployeeProfileSettingsView.dispatch()
  │     ├─→ EmployeeLoginRequiredMixin.dispatch()
  │     │     └─→ Check: hasattr(request, 'employee') and request.employee
  │     │         Result: False
  │     │
  │     └─→ REDIRECT: /login/
  │
END: User shown login page
```

## Detailed Request Flow - Authenticated Employee

```
START: User visits /login/
  │
  ├─→ Middleware checks request
  │     └─→ JWT token found and decoded
  │         request.employee = <Employee object>
  │
  ├─→ EmployeeLoginView.dispatch()
  │     ├─→ EmployeeNotAuthenticatedMixin.dispatch()
  │     │     └─→ Check: hasattr(request, 'employee') and request.employee
  │     │         Result: True
  │     │
  │     └─→ REDIRECT: /profile-settings/
  │
END: User shown profile settings page
```

## Detailed Request Flow - Authenticated Employee Accessing Staff

```
START: Employee visits /staff/login/
  │
  ├─→ Middleware checks request
  │     └─→ JWT token found and decoded as EMPLOYEE token
  │         request.employee = <Employee object>
  │
  ├─→ StaffLoginView (or staff endpoint)
  │     └─→ Security check detects employee
  │         (EmployeeStaffBlockerMixin or API permission)
  │
  │     └─→ REDIRECT: /profile-settings/
  │
END: Employee not shown staff interface
```

## Route Decision Tree

```
                        User Makes Request
                               │
                               ▼
                    Is JWT Token Valid?
                        /            \
                       /              \
                      ✓                ❌
                   (Auth)           (No Auth)
                    /                  \
                   /                    \
            ┌──────────────────┐    ┌──────────────────┐
            │ request.employee │    │ request.employee │
            │ is set           │    │ is None          │
            └────────┬─────────┘    └────────┬─────────┘
                     │                       │
        ┌────────────┴────────────┐          │
        │                         │          │
        ▼                         ▼          ▼
┌──────────────────┐   ┌─────────────────┐  │
│  Which Route?    │   │  Which Route?   │  │
└────────┬─────────┘   └────────┬────────┘  │
         │                      │           │
    ┌────┴─────┬──────┬────┐    │    ┌──────┴──────┬───────┐
    │           │      │    │    │    │             │       │
    ▼           ▼      ▼    ▼    ▼    ▼             ▼       ▼
 Public?    Protected? Staff? Other   Public?   Protected? Other
    │           │      │    │         │           │        │
    │           │      │    │         │           │        │
   NO          YES    YES   │        YES          NO       │
    ├─→        ├─→    ├─→   │         ├─→         ├─→      │
    │   ALLOW  │      │     │         │    ALLOW  │        │
    │          │      │     │         │           │        │
    │      DENY│  (Allow)   │       DENY      DENY│(Allow)
    │   REDIR: │              │       REDIR:      │
    │  /prof..│              │      /login/      │
    │          │              │                    │
    └──────────┴──────────────┴────────────────────┴────────
                             │
                             ▼
                        RESPONSE SENT
```

## Mixin Inheritance Order

```
CORRECT ORDER (Mixins before TemplateView):
┌─────────────────────────────────────────────────┐
│ class MyView(EmployeeLoginRequiredMixin,        │
│             TemplateView):                      │
│     ...                                         │
└─────────────────────────────────────────────────┘
           ▲                    ▲
           │                    │
       Mixin first         Base class last

Method Resolution Order (MRO):
1. MyView
2. EmployeeLoginRequiredMixin
3. EmployeeAuthenticationMixin
4. TemplateView
5. View
6. object

This ensures dispatch() is called in correct order!
```

## Redirect Chain Prevention

```
User visits /login/ (authenticated)
  │
  ├─→ EmployeeNotAuthenticatedMixin detects auth
  │     └─→ Redirects to /profile-settings/
  │
  ├─→ User now at /profile-settings/
  │     ├─→ EmployeeLoginRequiredMixin detects auth
  │     │     └─→ ✓ Allows access (auth required, user is auth)
  │     │
  │     └─→ Page shown ✓
  │
END: One redirect, not a loop!

Why this works:
- EmployeeNotAuthenticatedMixin redirects ONLY to /profile-settings/
- /profile-settings/ requires authentication (EmployeeLoginRequiredMixin)
- Authenticated user + protected page = no further redirect
```

## Complete Routing Matrix

```
┌────────────────────┬──────────────────┬──────────────────┬─────────────────┐
│ Route              │ Requires Auth?   │ Applied Mixin    │ Action          │
├────────────────────┼──────────────────┼──────────────────┼─────────────────┤
│ /login/            │ NO (public)      │ NotAuthenticated │ Redir if auth   │
│ /register/         │ NO (public)      │ NotAuthenticated │ Redir if auth   │
│ /verify-otp/       │ NO (public)      │ NotAuthenticated │ Redir if auth   │
│ /forgot-password/  │ NO (public)      │ NotAuthenticated │ Redir if auth   │
│ /reset-password/   │ NO (public)      │ NotAuthenticated │ Redir if auth   │
├────────────────────┼──────────────────┼──────────────────┼─────────────────┤
│ /profile-settings/ │ YES (protected)  │ LoginRequired    │ Redir if not    │
│ /change-password/  │ YES (protected)  │ LoginRequired    │ Redir if not    │
├────────────────────┼──────────────────┼──────────────────┼─────────────────┤
│ /staff/login/      │ Staff only       │ StaffBlocker     │ Redir employee  │
│ /staff/settings/   │ Staff only       │ N/A (API level)  │ Redir employee  │
└────────────────────┴──────────────────┴──────────────────┴─────────────────┘

Redirect Targets:
- /login/ (when not authenticated)
- /profile-settings/ (when authenticated on public pages)
- /staff/login/ (when staff access is required)
```

## Security Layers

```
┌─────────────────────────────────────────────────────────────┐
│                       Request                               │
└────────────────────────────┬────────────────────────────────┘
                             │
                  ┌──────────▼──────────┐
                  │ Layer 1: Middleware │ ◄─ Validate JWT Token
                  │ Authenticate User   │
                  └──────────┬──────────┘
                             │
                  ┌──────────▼──────────┐
                  │  Layer 2: Mixin     │ ◄─ Check Auth Status
                  │  Route Protection   │
                  └──────────┬──────────┘
                             │
                  ┌──────────▼──────────┐
                  │  Layer 3: View      │ ◄─ Load Template
                  │  Render Template    │    & Context
                  └──────────┬──────────┘
                             │
                  ┌──────────▼──────────┐
                  │  Layer 4: API       │ ◄─ DRF Permissions
                  │  Permission Checks  │    (for API calls)
                  └──────────┬──────────┘
                             │
                  ┌──────────▼──────────┐
                  │    Response         │
                  └─────────────────────┘
```

## Authentication State Diagram

```
                    START (No User)
                          │
                          ▼
                   ┌──────────────┐
        ┌────────→│ NOT_AUTHED   │◄────────────┐
        │         │              │             │
        │         │ • Can see    │             │
        │         │   login page │             │
        │         │ • Can see    │    Logout   │
        │         │   register   │             │
        │         └──────┬───────┘             │
        │                │ Login               │
        │                │ Success             │
        │                ▼                     │
        │         ┌──────────────┐             │
   Manual         │  AUTHED      │             │
   Token          │              │─────────────┘
   Clear          │ • Can see    │
        │         │   dashboard  │
        │         │ • Blocked    │
        │         │   from login │
        │         │ • Redir from │
        │         │   public     │
        │         └──────┬───────┘
        │                │
        └────────────────┘
             Token Exp.
             or Logout
```
