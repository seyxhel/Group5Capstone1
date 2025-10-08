# SmartSupport API Documentation

## Overview
SmartSupport is a comprehensive help desk ticket management system built with Django REST Framework. This API provides functionality for user management, authentication, ticket creation and management, file handling, and administrative operations.

**Base URL**: `https://smartsupport-hdts-backend.up.railway.app/api/`

## Table of Contents
1. [Authentication](#authentication)
2. [Employee Management](#employee-management)
3. [Ticket Management](#ticket-management)
4. [File Management](#file-management)
5. [Administrative Operations](#administrative-operations)
6. [User Profile Management](#user-profile-management)
7. [Password Management](#password-management)
8. [Data Models](#data-models)
9. [Error Handling](#error-handling)

---

## Authentication

The API uses JWT (JSON Web Token) authentication with separate endpoints for employees and administrators.

### 1. Employee Login
**Endpoint**: `POST /api/token/employee/`
**Description**: Authenticate an employee user

**Request Body**:
```json
{
    "email": "employee@example.com",
    "password": "password123"
}
```

**Response** (200 OK):
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "email": "employee@example.com",
    "role": "Employee",
    "first_name": "John",
    "last_name": "Doe",
    "dateCreated": "2023-01-01T00:00:00Z",
    "image": "https://..."
}
```

**Requirements**:
- User must have `status: "Approved"`
- User role cannot be "System Admin" or "Ticket Coordinator"

### 2. Admin Login
**Endpoint**: `POST /api/token/admin/`
**Description**: Authenticate an admin user

**Request Body**:
```json
{
    "email": "admin@example.com",
    "password": "adminpass123"
}
```

**Response** (200 OK):
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
    "email": "admin@example.com",
    "role": "System Admin",
    "first_name": "Jane"
}
```

**Requirements**:
- User must be superuser OR have role "System Admin" or "Ticket Coordinator"

### 3. Token Refresh
**Endpoint**: `POST /api/token/refresh/`
**Description**: Refresh an expired access token

**Request Body**:
```json
{
    "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Response** (200 OK):
```json
{
    "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

---

## Employee Management

### 1. Create Employee Account
**Endpoint**: `POST /api/create_employee/`
**Description**: Register a new employee account (public endpoint)

**Request Body** (multipart/form-data):
```json
{
    "first_name": "John",
    "last_name": "Doe",
    "middle_name": "Smith",
    "suffix": "Jr.",
    "email": "john.doe@example.com",
    "password": "securepassword123",
    "confirm_password": "securepassword123",
    "department": "IT Department",
    "image": "<file>"
}
```

**Response** (201 Created):
```json
{
    "message": "Account created successfully. Pending approval. Email sent successfully",
    "employee_id": 123,
    "email": "john.doe@example.com"
}
```

**Notes**:
- Account status is set to "Pending" by default
- Confirmation email is sent automatically
- Company ID is auto-generated (format: MA0001-MA9999)

### 2. Admin Create Employee
**Endpoint**: `POST /api/admin/create-employee/`
**Description**: Create employee account by admin
**Authentication**: Required (Admin)

**Request Body**:
```json
{
    "first_name": "John",
    "last_name": "Doe",
    "email": "john.doe@example.com",
    "department": "IT Department",
    "role": "Employee"
}
```

**Response** (201 Created):
```json
{
    "message": "Employee account created successfully",
    "company_id": "MA0001",
    "employee": {
        "id": 123,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "company_id": "MA0001",
        "department": "IT Department",
        "role": "Employee",
        "status": "Pending",
        "image": "https://..."
    }
}
```

### 3. List All Employees
**Endpoint**: `GET /api/employees/`
**Description**: Get list of all employees
**Authentication**: Required (System Admin only)

**Response** (200 OK):
```json
[
    {
        "id": 123,
        "first_name": "John",
        "last_name": "Doe",
        "middle_name": "Smith",
        "suffix": "Jr.",
        "company_id": "MA0001",
        "department": "IT Department",
        "email": "john.doe@example.com",
        "image": "https://...",
        "role": "Employee",
        "status": "Approved",
        "date_created": "2023-01-01T00:00:00Z"
    }
]
```

### 4. Approve Employee
**Endpoint**: `POST /api/employees/{employee_id}/approve/`
**Description**: Approve a pending employee account
**Authentication**: Required (System Admin only)

**Response** (200 OK):
```json
{
    "detail": "Employee approved and email sent."
}
```

### 5. Reject Employee
**Endpoint**: `POST /api/employees/{employee_id}/reject/`
**Description**: Reject a pending employee account
**Authentication**: Required (System Admin only)

**Request Body**:
```json
{
    "reason": "Invalid credentials provided"
}
```

**Response** (200 OK):
```json
{
    "detail": "Employee rejected, audited, and deleted."
}
```

**Notes**:
- Employee record is moved to audit table before deletion
- Rejection email is sent automatically

### 6. Rejected Employee Audit List
**Endpoint**: `GET /api/rejected-employees/`
**Description**: Get list of rejected employees for audit purposes
**Authentication**: Required

**Response** (200 OK):
```json
[
    {
        "id": 1,
        "company_id": "MA0001",
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "department": "IT Department",
        "timestamp": "2023-01-01T00:00:00Z"
    }
]
```

### 7. Rejected Users Count
**Endpoint**: `GET /api/admin/rejected-users-count/`
**Description**: Get count of rejected users for dashboard
**Authentication**: Required (Admin User)

**Response** (200 OK):
```json
{
    "rejected_users_count": 5
}
```

---

## Ticket Management

### 1. Create Ticket
**Endpoint**: `POST /api/tickets/`
**Description**: Create a new support ticket
**Authentication**: Required

**Request Body** (multipart/form-data):
```json
{
    "subject": "Application Error",
    "category": "Software",
    "sub_category": "Application Error",
    "description": "The application crashes when I try to save data",
    "scheduled_date": "2023-12-25",
    "files[]": ["<file1>", "<file2>"]
}
```

**Response** (201 Created):
```json
{
    "id": 456,
    "ticket_number": "TX0001",
    "subject": "Application Error",
    "category": "Software",
    "sub_category": "Application Error",
    "description": "The application crashes when I try to save data",
    "scheduled_date": "2023-12-25",
    "priority": null,
    "department": null,
    "status": "New",
    "submit_date": "2023-01-01T00:00:00Z",
    "update_date": "2023-01-01T00:00:00Z",
    "assigned_to": null,
    "attachments": [
        {
            "id": 1,
            "file": "https://...?token=...",
            "file_name": "screenshot.png",
            "file_type": "image/png",
            "file_size": 1024576,
            "upload_date": "2023-01-01T00:00:00Z"
        }
    ],
    "employee": {
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "company_id": "MA0001",
        "department": "IT Department",
        "image": "https://..."
    }
}
```

### 2. Get Ticket Details
**Endpoint**: `GET /api/tickets/{ticket_id}/`
**Description**: Get detailed information about a specific ticket
**Authentication**: Required

**Response** (200 OK):
```json
{
    "id": 456,
    "ticket_number": "TX0001",
    "subject": "Application Error",
    "category": "Software",
    "sub_category": "Application Error",
    "description": "The application crashes when I try to save data",
    "attachments": [
        {
            "id": 1,
            "file": "https://...?token=...",
            "file_name": "screenshot.png",
            "file_type": "image/png",
            "file_size": 1024576,
            "upload_date": "2023-01-01T00:00:00Z"
        }
    ],
    "status": "Open",
    "priority": "High",
    "department": "IT Department",
    "submit_date": "2023-01-01T00:00:00Z",
    "update_date": "2023-01-01T00:00:00Z",
    "assigned_to": {
        "id": 789,
        "first_name": "Jane",
        "last_name": "Smith"
    },
    "employee": {
        "id": 123,
        "first_name": "John",
        "last_name": "Doe",
        "company_id": "MA0001",
        "department": "IT Department",
        "email": "john.doe@example.com"
    },
    "comments": [
        {
            "id": 1,
            "comment": "Ticket approved and set to Open",
            "created_at": "2023-01-01T00:00:00Z",
            "is_internal": true,
            "user": {
                "first_name": "Jane",
                "last_name": "Smith",
                "role": "System Admin"
            }
        }
    ]
}
```

**Permission Logic**:
- Employees can only view their own tickets
- Admins/Coordinators can view all tickets
- Admins see all comments (including internal)
- Employees only see non-internal comments

### 3. List Tickets (ViewSet)
**Endpoint**: `GET /api/tickets/`
**Description**: Get list of tickets based on user role
**Authentication**: Required

**Query Parameters**:
- Standard DRF pagination and filtering

**Response** (200 OK):
```json
{
    "count": 100,
    "next": "https://api.example.com/tickets/?page=2",
    "previous": null,
    "results": [
        {
            "id": 456,
            "ticket_number": "TX0001",
            "subject": "Application Error",
            "category": "Software",
            "sub_category": "Application Error",
            "description": "The application crashes...",
            "scheduled_date": "2023-12-25",
            "priority": "High",
            "department": "IT Department",
            "status": "Open",
            "submit_date": "2023-01-01T00:00:00Z",
            "update_date": "2023-01-01T00:00:00Z",
            "assigned_to": "Jane Smith",
            "attachments": [...],
            "employee": {...}
        }
    ]
}
```

### 4. Get New Tickets
**Endpoint**: `GET /api/tickets/new/`
**Description**: Get all tickets with 'New' status for admin review
**Authentication**: Required (System Admin or Ticket Coordinator)

**Response** (200 OK):
```json
[
    {
        "id": 456,
        "ticket_number": "TX0001",
        "subject": "Application Error",
        "category": "Software",
        "sub_category": "Application Error",
        "status": "New",
        "submit_date": "2023-01-01T00:00:00Z",
        "employee_name": "John Doe",
        "employee_department": "IT Department",
        "has_attachment": true
    }
]
```

### 5. Get Open Tickets
**Endpoint**: `GET /api/tickets/open/`
**Description**: Get all tickets with 'Open' status
**Authentication**: Required (System Admin or Ticket Coordinator)

**Response** (200 OK):
```json
[
    {
        "id": 456,
        "ticket_number": "TX0001",
        "subject": "Application Error",
        "category": "Software",
        "sub_category": "Application Error",
        "description": "The application crashes...",
        "scheduled_date": "2023-12-25",
        "priority": "High",
        "department": "IT Department",
        "status": "Open",
        "submit_date": "2023-01-01T00:00:00Z",
        "update_date": "2023-01-01T00:00:00Z",
        "assigned_to": "Jane Smith",
        "attachments": [...],
        "employee": {...}
    }
]
```

### 6. Get My Tickets
**Endpoint**: `GET /api/tickets/my-tickets/`
**Description**: Get all tickets assigned to the current admin user
**Authentication**: Required (System Admin or Ticket Coordinator)

**Response** (200 OK):
```json
[
    {
        "id": 456,
        "ticket_number": "TX0001",
        "subject": "Application Error",
        "category": "Software",
        "priority": "High",
        "department": "IT Department",
        "status": "In Progress",
        "submit_date": "2023-01-01T00:00:00Z",
        "update_date": "2023-01-01T00:00:00Z",
        "employee_name": "John Doe",
        "employee_department": "IT Department",
        "has_attachment": true
    }
]
```

### 7. Approve Ticket
**Endpoint**: `POST /api/tickets/{ticket_id}/approve/`
**Description**: Approve a ticket and set priority/department
**Authentication**: Required (System Admin or Ticket Coordinator)

**Request Body**:
```json
{
    "priority": "High",
    "department": "IT Department",
    "approval_notes": "Ticket approved for processing"
}
```

**Response** (200 OK):
```json
{
    "message": "Ticket approved successfully",
    "ticket_id": 456,
    "status": "Open",
    "priority": "High",
    "department": "IT Department"
}
```

**Valid Priority Levels**: `Critical`, `High`, `Medium`, `Low`
**Valid Departments**: `IT Department`, `Asset Department`, `Budget Department`

### 8. Reject Ticket
**Endpoint**: `POST /api/tickets/{ticket_id}/reject/`
**Description**: Reject a ticket with a reason
**Authentication**: Required (System Admin or Ticket Coordinator)

**Request Body**:
```json
{
    "rejection_reason": "Insufficient information provided"
}
```

**Response** (200 OK):
```json
{
    "message": "Ticket rejected successfully",
    "ticket_id": 456,
    "status": "Rejected",
    "rejection_reason": "Insufficient information provided"
}
```

### 9. Claim Ticket
**Endpoint**: `POST /api/tickets/{ticket_id}/claim/`
**Description**: Claim an open ticket for processing
**Authentication**: Required

**Response** (200 OK):
```json
{
    "message": "Ticket successfully claimed.",
    "ticket_id": 456,
    "status": "In Progress",
    "assigned_to": "admin@example.com"
}
```

### 10. Update Ticket Status
**Endpoint**: `POST /api/tickets/{ticket_id}/update-status/`
**Description**: Update ticket status with optional comment
**Authentication**: Required (System Admin or Ticket Coordinator)

**Request Body**:
```json
{
    "status": "Resolved",
    "comment": "Issue has been resolved by updating the software"
}
```

**Response** (200 OK):
```json
{
    "message": "Ticket status updated successfully",
    "ticket_id": 456,
    "old_status": "In Progress",
    "new_status": "Resolved"
}
```

**Valid Statuses**: `Open`, `In Progress`, `Resolved`, `Closed`, `On Hold`

### 11. Withdraw Ticket
**Endpoint**: `POST /api/tickets/{ticket_id}/withdraw/`
**Description**: Allow ticket owner to withdraw their ticket
**Authentication**: Required (Ticket Owner)

**Request Body**:
```json
{
    "comment": "Issue resolved internally"
}
```

**Response** (200 OK):
```json
{
    "message": "Ticket withdrawn successfully.",
    "status": "Withdrawn"
}
```

### 12. Close Ticket
**Endpoint**: `POST /api/tickets/{ticket_id}/close/`
**Description**: Allow ticket owner to close a resolved ticket
**Authentication**: Required (Ticket Owner)

**Request Body**:
```json
{
    "comment": "Satisfied with the resolution"
}
```

**Response** (200 OK):
```json
{
    "message": "Ticket closed successfully.",
    "status": "Closed"
}
```

### 13. Finalize Ticket
**Endpoint**: `POST /api/tickets/{ticket_id}/finalize/`
**Description**: Finalize ticket and send to external workflow
**Authentication**: Required

**Response** (200 OK):
```json
{
    "detail": "Ticket finalized and sent to workflow."
}
```

---

## File Management

### 1. Download Attachment
**Endpoint**: `GET /api/attachments/{attachment_id}/download/`
**Description**: Securely download ticket attachments
**Authentication**: Required (JWT token in Authorization header or query parameter)

**Query Parameters** (optional):
- `token`: JWT token for authentication

**Response** (200 OK):
- File content with appropriate headers
- `Content-Type`: Based on file type
- `Content-Disposition`: `inline` for images/PDFs, `attachment` for others

**Permission Logic**:
- System Admins and Ticket Coordinators can access all attachments
- Employees can only access attachments from their own tickets
- External systems can access with valid API key

### 2. Secure Media Access
**Endpoint**: `GET /media/{file_path}`
**Description**: Serve media files with authentication
**Authentication**: Required (JWT token or API key)

**Query Parameters**:
- `token`: JWT token for user authentication
- `api_key`: API key for external system access

**Response**: File content with security headers

---

## User Profile Management

### 1. Get Employee Profile
**Endpoint**: `GET /api/employee/profile/`
**Description**: Get current user's profile information
**Authentication**: Required

**Response** (200 OK):
```json
{
    "id": 123,
    "first_name": "John",
    "last_name": "Doe",
    "middle_name": "Smith",
    "suffix": "Jr.",
    "company_id": "MA0001",
    "department": "IT Department",
    "email": "john.doe@example.com",
    "image": "https://...",
    "role": "Employee",
    "status": "Approved",
    "date_created": "2023-01-01T00:00:00Z"
}
```

### 2. Upload Profile Image
**Endpoint**: `POST /api/employee/upload-image/`
**Description**: Upload or update profile image
**Authentication**: Required

**Request Body** (multipart/form-data):
```json
{
    "image": "<file>"
}
```

**Response** (200 OK):
```json
{
    "detail": "Image uploaded successfully.",
    "user": {
        "id": 123,
        "first_name": "John",
        "last_name": "Doe",
        "email": "john.doe@example.com",
        "image": "https://..."
    }
}
```

**File Requirements**:
- Supported formats: PNG, JPEG, JPG
- Maximum size: 2MB
- Image is automatically resized to 1024x1024

---

## Password Management

### 1. Change Password
**Endpoint**: `POST /api/employee/change-password/`
**Description**: Change user's password
**Authentication**: Required

**Request Body**:
```json
{
    "current_password": "oldpassword123",
    "new_password": "newpassword456"
}
```

**Response** (200 OK):
```json
{
    "detail": "Password changed successfully."
}
```

### 2. Check Password
**Endpoint**: `POST /api/employee/check-password/`
**Description**: Verify current password
**Authentication**: Required

**Request Body**:
```json
{
    "current_password": "password123"
}
```

**Response** (200 OK):
```json
{
    "detail": "Password correct."
}
```

### 3. Forgot Password
**Endpoint**: `POST /api/employee/forgot-password/`
**Description**: Send password reset link via email

**Request Body**:
```json
{
    "email": "john.doe@example.com"
}
```

**Response** (200 OK):
```json
{
    "detail": "Password reset link sent."
}
```

### 4. Reset Password
**Endpoint**: `POST /api/employee/reset-password/`
**Description**: Reset password using token from email

**Request Body**:
```json
{
    "uidb64": "encoded_user_id",
    "token": "reset_token",
    "new_password": "newpassword123"
}
```

**Response** (200 OK):
```json
{
    "detail": "Password reset successful."
}
```

---

## Administrative Operations

### 1. API Root
**Endpoint**: `GET /api/`
**Description**: Get list of available API endpoints

**Response** (200 OK):
```json
{
    "create_employee": "https://api.example.com/create_employee/",
    "admin-create-employee": "https://api.example.com/admin/create-employee/",
    "token_employee": "https://api.example.com/token/employee/",
    "admin_token_obtain_pair": "https://api.example.com/token/admin/",
    "token_refresh": "https://api.example.com/token/refresh/",
    "employee_profile": "https://api.example.com/employee/profile/",
    "tickets": "https://api.example.com/tickets/"
}
```

---

## Data Models

### Employee Model
```json
{
    "id": "integer",
    "last_name": "string (max 100)",
    "first_name": "string (max 100)",
    "middle_name": "string (max 100, optional)",
    "suffix": "string (choices: Jr., Sr., III, IV, V, VI, VII, VIII, IX, X)",
    "company_id": "string (format: MA0001-MA9999, unique)",
    "department": "string (choices: IT Department, Asset Department, Budget Department)",
    "email": "email (unique)",
    "password": "string (hashed)",
    "image": "file (default: employee_images/default-profile.png)",
    "role": "string (choices: Employee, Ticket Coordinator, System Admin)",
    "status": "string (choices: Pending, Approved, Rejected)",
    "notified": "boolean (default: false)",
    "is_staff": "boolean (default: false)",
    "is_superuser": "boolean (default: false)",
    "date_created": "datetime (auto)"
}
```

### Ticket Model
```json
{
    "id": "integer",
    "ticket_number": "string (format: TX0001-TX9999, unique, auto-generated)",
    "employee": "foreign_key (Employee)",
    "subject": "string (max 255)",
    "category": "string (max 100)",
    "sub_category": "string (max 100)",
    "description": "text",
    "scheduled_date": "date (optional)",
    "priority": "string (choices: Critical, High, Medium, Low)",
    "department": "string (choices: IT Department, Asset Department, Budget Department)",
    "status": "string (choices: New, Open, In Progress, On Hold, Pending, Resolved, Rejected, Closed, Withdrawn)",
    "submit_date": "datetime (auto)",
    "update_date": "datetime (auto)",
    "assigned_to": "foreign_key (Employee, optional)",
    "response_time": "duration (optional)",
    "resolution_time": "duration (optional)",
    "time_closed": "datetime (optional)",
    "rejection_reason": "text (optional)"
}
```

### Ticket Attachment Model
```json
{
    "id": "integer",
    "ticket": "foreign_key (Ticket)",
    "file": "file (path: ticket_attachments/)",
    "file_name": "string (max 255)",
    "file_type": "string (max 100)",
    "file_size": "integer (bytes)",
    "upload_date": "datetime (auto)",
    "uploaded_by": "foreign_key (Employee)"
}
```

### Ticket Comment Model
```json
{
    "id": "integer",
    "ticket": "foreign_key (Ticket)",
    "user": "foreign_key (Employee)",
    "comment": "text",
    "is_internal": "boolean (default: false)",
    "created_at": "datetime (auto)"
}
```

### Rejected Employee Audit Model
```json
{
    "id": "integer",
    "first_name": "string (max 100)",
    "last_name": "string (max 100)",
    "email": "email",
    "company_id": "string (max 100)",
    "department": "string (max 100)",
    "rejected_at": "datetime (auto)",
    "reason": "text (optional)"
}
```

---

## Error Handling

### Standard HTTP Status Codes

- **200 OK**: Successful GET, PUT, PATCH requests
- **201 Created**: Successful POST requests that create resources
- **400 Bad Request**: Invalid request data or validation errors
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Permission denied
- **404 Not Found**: Resource not found
- **405 Method Not Allowed**: HTTP method not supported
- **500 Internal Server Error**: Server-side errors

### Error Response Format
```json
{
    "error": "Error message description",
    "detail": "Detailed error information",
    "field_errors": {
        "field_name": ["Field-specific error message"]
    }
}
```

### Common Error Scenarios

1. **Authentication Errors**:
   - Invalid credentials
   - Expired tokens
   - Missing authentication headers

2. **Permission Errors**:
   - Insufficient user role
   - Accessing unauthorized resources
   - Account status not approved

3. **Validation Errors**:
   - Missing required fields
   - Invalid data formats
   - File upload restrictions

4. **Business Logic Errors**:
   - Invalid state transitions
   - Duplicate resources
   - Resource constraints

---

## Rate Limiting & Security

### Security Features
- JWT-based authentication
- Secure file downloads with token validation
- CSRF protection
- SQL injection prevention
- XSS protection
- Secure media serving

### File Security
- Authentication required for all file access
- Role-based file permissions
- Secure file paths validation
- File type restrictions

### External System Access
- API key authentication for external systems
- Secure webhook endpoints
- Rate limiting on public endpoints

---

## Integration Notes

### External Workflow Integration
The system integrates with external workflow systems through:
- Celery task queue for asynchronous processing
- Ticket serialization for external APIs
- Secure file URLs with API keys
- Status update callbacks

### Email Integration
- Gmail API integration for notifications
- Account approval/rejection emails
- Password reset emails
- Ticket status notifications

### Frontend Integration
- CORS configuration for frontend domains
- Secure media URLs with JWT tokens
- WebSocket support for real-time updates
- Mobile-responsive API endpoints

---

This documentation covers all the main API endpoints and functionality of the SmartSupport system. For additional technical details or specific implementation questions, refer to the Django REST Framework documentation and the system's source code.