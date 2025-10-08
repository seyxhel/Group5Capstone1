# SmartSupport Microservices Documentation

## Table of Contents
1. [Microservices Overview](#microservices-overview)
2. [Core Microservices](#core-microservices)
3. [Service Communication Patterns](#service-communication-patterns)
4. [Data Services](#data-services)
5. [External Integration Services](#external-integration-services)
6. [Frontend Service Components](#frontend-service-components)
7. [Infrastructure Services](#infrastructure-services)
8. [Service Deployment Topology](#service-deployment-topology)
9. [Service Dependencies](#service-dependencies)
10. [Scaling & Performance](#scaling--performance)
11. [Security Services](#security-services)
12. [Monitoring & Observability](#monitoring--observability)
13. [Service Evolution Strategy](#service-evolution-strategy)

---

## Microservices Overview

SmartSupport employs a **service-oriented architecture** that bridges traditional monolithic design with modern microservices principles. While currently deployed as a distributed monolith with clear service boundaries, the system is architected to support future microservices decomposition.

### Service Architecture Philosophy
- **Domain-Driven Design**: Services are organized around business capabilities
- **Single Responsibility**: Each service handles one business domain
- **Loose Coupling**: Services communicate through well-defined APIs
- **High Cohesion**: Related functionalities are grouped within service boundaries
- **Technology Agnostic**: Services can use different technologies where appropriate

### Current Service Topology
```
┌─────────────────────────────────────────────────────────────────┐
│                    SmartSupport System                          │
├─────────────────────────────────────────────────────────────────┤
│  Frontend Services          │  Backend Services                 │
│  ┌─────────────────────┐   │  ┌─────────────────────────────┐  │
│  │ Web Application     │   │  │ API Gateway Service         │  │
│  │ Service             │   │  │ (Django REST Framework)     │  │
│  └─────────────────────┘   │  └─────────────────────────────┘  │
│  ┌─────────────────────┐   │  ┌─────────────────────────────┐  │
│  │ Authentication      │   │  │ Authentication Service      │  │
│  │ Client Service      │   │  │ (JWT Management)            │  │
│  └─────────────────────┘   │  └─────────────────────────────┘  │
│  ┌─────────────────────┐   │  ┌─────────────────────────────┐  │
│  │ AI Chatbot          │   │  │ User Management Service     │  │
│  │ Service             │   │  │ (Employee CRUD)             │  │
│  └─────────────────────┘   │  └─────────────────────────────┘  │
│                             │  ┌─────────────────────────────┐  │
│                             │  │ Ticket Management Service   │  │
│                             │  │ (Ticket Lifecycle)          │  │
│                             │  └─────────────────────────────┘  │
│                             │  ┌─────────────────────────────┐  │
│                             │  │ File Management Service     │  │
│                             │  │ (Secure Media Handling)     │  │
│                             │  └─────────────────────────────┘  │
│                             │  ┌─────────────────────────────┐  │
│                             │  │ Notification Service        │  │
│                             │  │ (Email & Alerts)            │  │
│                             │  └─────────────────────────────┘  │
│                             │  ┌─────────────────────────────┐  │
│                             │  │ Background Processing       │  │
│                             │  │ Service (Celery Tasks)      │  │
│                             │  └─────────────────────────────┘  │
│                             │  ┌─────────────────────────────┐  │
│                             │  │ External Integration        │  │
│                             │  │ Service (Workflow API)      │  │
│                             │  └─────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Microservices

### 1. **API Gateway Service**
**Technology**: Django REST Framework  
**Purpose**: Central entry point for all backend operations  
**Port**: 8000  
**Deployment**: Railway Backend Service  

#### Service Responsibilities
```yaml
Primary Functions:
  - Request routing and load balancing
  - Authentication and authorization
  - Rate limiting and throttling
  - Request/response transformation
  - Error handling and standardization
  - API versioning management
  - CORS policy enforcement

API Endpoints:
  - /api/auth/* (Authentication endpoints)
  - /api/employees/* (User management)
  - /api/tickets/* (Ticket operations)
  - /api/attachments/* (File operations)
  - /api/admin/* (Administrative functions)
```

#### Service Architecture
```python
# Core Components
core/
├── urls.py              # API routing configuration
├── views.py             # Request handlers and business logic
├── serializers.py       # Data transformation layer
├── models.py            # Data models and business entities
├── permissions.py       # Authorization logic
└── middleware/          # Custom middleware components
    ├── auth_middleware.py
    ├── cors_middleware.py
    └── rate_limit_middleware.py
```

#### Configuration
```yaml
Environment Variables:
  DJANGO_SECRET_KEY: API security key
  DEBUG: Development/production mode flag
  ALLOWED_HOSTS: Permitted host domains
  CORS_ALLOWED_ORIGINS: Frontend domain whitelist
  
Security Features:
  - JWT token validation
  - CSRF protection
  - SQL injection prevention
  - XSS protection
  - Rate limiting
```

---

### 2. **Authentication Service**
**Technology**: Django SimpleJWT + Custom Authentication  
**Purpose**: Identity and access management  
**Integration**: Embedded within API Gateway  

#### Service Responsibilities
```yaml
Core Functions:
  - User authentication (login/logout)
  - JWT token generation and validation
  - Token refresh management
  - Password management (reset/change)
  - Session management
  - Role-based access control

Supported Authentication Methods:
  - Employee JWT authentication
  - Admin JWT authentication
  - External system API key authentication
  - Token-based file access authentication
```

#### Authentication Flow Architecture
```python
# Authentication Components
authentication/
├── jwt_handlers.py      # JWT token management
├── serializers.py       # Authentication serializers
├── permissions.py       # Role-based permissions
├── validators.py        # Input validation
└── backends.py          # Custom authentication backends

# Authentication Endpoints
/api/token/employee/     # Employee login
/api/token/admin/        # Admin login
/api/token/refresh/      # Token refresh
/api/employee/forgot-password/    # Password reset
/api/employee/reset-password/     # Password reset confirmation
/api/employee/change-password/    # Password change
```

#### Security Implementation
```yaml
JWT Configuration:
  Access Token Lifetime: 1 day
  Refresh Token Lifetime: 1 day
  Token Rotation: Enabled
  Blacklist After Rotation: Enabled
  Algorithm: HS256

Role-Based Access Control:
  Employee: Basic ticket operations
  Ticket Coordinator: Ticket management + assignment
  System Admin: Full system access + user management

External System Security:
  API Key Authentication: Shared secret for external services
  File Access Tokens: Embedded in URLs for secure media access
  Cross-Origin Resource Sharing: Configured for frontend domains
```

---

### 3. **User Management Service**
**Technology**: Django Models + Custom User Management  
**Purpose**: Employee lifecycle and profile management  
**Database**: PostgreSQL Employee tables  

#### Service Responsibilities
```yaml
Core Functions:
  - Employee registration and approval workflow
  - User profile management
  - Role and permission assignment
  - Account lifecycle management
  - Profile image handling
  - User audit trails

Business Logic:
  - Company ID generation (MA0001-MA9999)
  - Employee status management (Pending/Approved/Rejected)
  - Department and role assignment
  - Profile image processing and storage
  - Account approval/rejection with notifications
```

#### Data Model Architecture
```python
# User Management Models
class Employee(AbstractBaseUser, PermissionsMixin):
    # Personal Information
    first_name = CharField(max_length=100)
    last_name = CharField(max_length=100)
    middle_name = CharField(max_length=100, blank=True, null=True)
    suffix = CharField(max_length=10, choices=SUFFIX_CHOICES)
    
    # Company Information
    company_id = CharField(max_length=6, unique=True)  # MA0001-MA9999
    department = CharField(choices=DEPARTMENT_CHOICES)
    role = CharField(choices=ROLE_CHOICES, default='Employee')
    
    # Account Information
    email = EmailField(unique=True)
    password = CharField(max_length=128)
    status = CharField(choices=STATUS_CHOICES, default='Pending')
    image = ImageField(upload_to='employee_images/', default='default-profile.png')
    
    # System Information
    is_staff = BooleanField(default=False)
    is_superuser = BooleanField(default=False)
    notified = BooleanField(default=False)
    date_created = DateTimeField(auto_now_add=True)

class RejectedEmployeeAudit(Model):
    # Audit trail for rejected employees
    first_name = CharField(max_length=100)
    last_name = CharField(max_length=100)
    email = EmailField()
    company_id = CharField(max_length=100)
    department = CharField(max_length=100)
    rejected_at = DateTimeField(auto_now_add=True)
    reason = TextField(blank=True, null=True)
```

#### Service Endpoints
```yaml
Employee Management APIs:
  POST /api/create_employee/           # Public employee registration
  POST /api/admin/create-employee/     # Admin-created employee
  GET  /api/employees/                 # List all employees (admin only)
  POST /api/employees/{id}/approve/    # Approve pending employee
  POST /api/employees/{id}/reject/     # Reject pending employee
  GET  /api/employee/profile/          # Get current user profile
  POST /api/employee/upload-image/     # Upload profile image
  
Administrative APIs:
  GET /api/admin/rejected-users-count/ # Dashboard statistics
  GET /api/rejected-employees/         # Audit trail for rejected users
```

#### Business Process Flows
```yaml
Employee Registration Flow:
  1. Employee submits registration form
  2. System generates unique company ID
  3. Account created with "Pending" status
  4. Email notification sent to employee
  5. Admin reviews and approves/rejects
  6. Status updated and notification sent
  7. Approved users can login, rejected users audited

Profile Management Flow:
  1. Employee uploads profile image
  2. Image processed and resized (1024x1024)
  3. Secure URL generated with token
  4. Image served through authentication layer
  5. Profile updates propagated to related services
```

---

### 4. **Ticket Management Service**
**Technology**: Django REST Framework ViewSets  
**Purpose**: Complete ticket lifecycle management  
**Database**: PostgreSQL Ticket-related tables  

#### Service Responsibilities
```yaml
Core Functions:
  - Ticket creation and submission
  - Ticket lifecycle management
  - Status transitions and validations
  - Assignment and routing
  - Priority and categorization
  - Comments and communication
  - Reporting and analytics

Ticket States:
  - New: Initial submission
  - Open: Approved and ready for work
  - In Progress: Being actively worked on
  - On Hold: Temporarily paused
  - Pending: Waiting for information
  - Resolved: Solution provided
  - Closed: Confirmed resolution
  - Rejected: Not actionable
  - Withdrawn: Cancelled by submitter
```

#### Data Model Architecture
```python
# Ticket Management Models
class Ticket(Model):
    # Identification
    id = BigAutoField(primary_key=True)
    ticket_number = CharField(max_length=6, unique=True)  # TX0001-TX9999
    
    # Core Information
    employee = ForeignKey(Employee, on_delete=CASCADE, related_name="tickets")
    subject = CharField(max_length=255)
    category = CharField(max_length=100)
    sub_category = CharField(max_length=100)
    description = TextField()
    scheduled_date = DateField(null=True, blank=True)
    
    # Classification
    priority = CharField(choices=PRIORITY_LEVELS, blank=True, null=True)
    department = CharField(choices=DEPARTMENT_CHOICES, blank=True, null=True)
    status = CharField(choices=STATUS_CHOICES, default='New')
    
    # Assignment and Tracking
    assigned_to = ForeignKey(Employee, on_delete=SET_NULL, null=True, blank=True, related_name='assigned_tickets')
    submit_date = DateTimeField(auto_now_add=True)
    update_date = DateTimeField(auto_now=True)
    response_time = DurationField(blank=True, null=True)
    resolution_time = DurationField(blank=True, null=True)
    time_closed = DateTimeField(blank=True, null=True)
    rejection_reason = TextField(blank=True, null=True)

class TicketAttachment(Model):
    ticket = ForeignKey(Ticket, on_delete=CASCADE, related_name='attachments')
    file = FileField(upload_to='ticket_attachments/')
    file_name = CharField(max_length=255)
    file_type = CharField(max_length=100)
    file_size = IntegerField()  # Size in bytes
    upload_date = DateTimeField(auto_now_add=True)
    uploaded_by = ForeignKey(Employee, on_delete=SET_NULL, null=True)

class TicketComment(Model):
    ticket = ForeignKey(Ticket, on_delete=CASCADE, related_name='comments')
    user = ForeignKey(Employee, on_delete=CASCADE)
    comment = TextField()
    is_internal = BooleanField(default=False)  # Admin-only comments
    created_at = DateTimeField(auto_now_add=True)
```

#### Service Endpoints
```yaml
Ticket CRUD Operations:
  GET    /api/tickets/                    # List tickets (filtered by role)
  POST   /api/tickets/                    # Create new ticket
  GET    /api/tickets/{id}/               # Get ticket details
  PUT    /api/tickets/{id}/               # Update ticket
  DELETE /api/tickets/{id}/               # Delete ticket

Ticket Management Operations:
  GET  /api/tickets/new/                  # Get new tickets for review
  GET  /api/tickets/open/                 # Get open tickets
  GET  /api/tickets/my-tickets/           # Get assigned tickets
  POST /api/tickets/{id}/approve/         # Approve ticket
  POST /api/tickets/{id}/reject/          # Reject ticket with reason
  POST /api/tickets/{id}/claim/           # Claim ticket for assignment
  POST /api/tickets/{id}/update-status/   # Update ticket status
  POST /api/tickets/{id}/finalize/        # Finalize and send to workflow
  POST /api/tickets/{id}/withdraw/        # Withdraw ticket (employee)
  POST /api/tickets/{id}/close/           # Close resolved ticket (employee)
```

#### Business Process Flows
```yaml
Ticket Creation Flow:
  1. Employee submits ticket with attachments
  2. System generates unique ticket number (TX0001-TX9999)
  3. Ticket created with "New" status
  4. Admin reviews and approves/rejects
  5. Approved tickets move to "Open" status
  6. External workflow system notified
  7. Ticket assigned and processed

Ticket Lifecycle Flow:
  New → (Admin Review) → Open → (Assignment) → In Progress → Resolved → Closed
                      ↓
                   Rejected

Status Transition Rules:
  - Only "New" tickets can be approved/rejected
  - Only "Open" tickets can be claimed
  - Only ticket owners can withdraw tickets
  - Only "Resolved" tickets can be closed by employees
  - Admins can update status at any time
```

---

### 5. **File Management Service**
**Technology**: Django FileField + Custom Secure Serving  
**Purpose**: Secure file storage and access control  
**Storage**: Railway Volume Storage  

#### Service Responsibilities
```yaml
Core Functions:
  - Secure file upload and storage
  - Authentication-based file access
  - File type validation and processing
  - Image resizing and optimization
  - Secure URL generation with tokens
  - External system file access
  - File download and streaming

Security Features:
  - Token-based authentication
  - Role-based file access permissions
  - Path traversal protection
  - File type restrictions
  - Size limitations
  - External API key support
```

#### File Storage Architecture
```python
# File Management Components
file_management/
├── secure_media.py      # Secure file serving
├── media_utils.py       # URL generation utilities
├── validators.py        # File validation
└── processors.py        # Image processing

# Storage Structure
/app/media/
├── employee_images/
│   ├── default-profile.png
│   ├── profile_123.jpg
│   └── profile_456.jpg
└── ticket_attachments/
    ├── document_789.pdf
    ├── screenshot_101.png
    └── spreadsheet_112.xlsx
```

#### Secure File Serving Implementation
```python
@csrf_exempt
@cache_control(private=True, max_age=3600)
def serve_secure_media(request, file_path):
    """
    Serve media files with authentication check
    Supports JWT tokens and API keys
    """
    # Check for external system API key first
    api_key = request.GET.get('api_key') or request.headers.get('X-API-Key')
    if api_key and validate_external_api_key(api_key):
        return serve_media_file(file_path, request, skip_auth_check=True)
    
    # Authenticate via JWT token (header or query parameter)
    user = authenticate_jwt_token(request)
    if not user:
        return HttpResponseForbidden("Authentication required")
    
    # Check file permissions
    if not has_file_permission(user, file_path):
        return HttpResponseForbidden("Permission denied")
    
    return serve_media_file(file_path, request)

def has_file_permission(user, file_path):
    """
    Permission logic for file access
    """
    # System Admins and Ticket Coordinators: Full access
    if user.role in ['System Admin', 'Ticket Coordinator']:
        return True
    
    # Employee profile images: Own files only
    if file_path.startswith('employee_images/'):
        return user.image and user.image.name == file_path
    
    # Ticket attachments: Own tickets only
    if file_path.startswith('ticket_attachments/'):
        attachment = TicketAttachment.objects.filter(file=file_path).first()
        return attachment and attachment.ticket.employee == user
    
    return False
```

#### Service Endpoints
```yaml
File Operations:
  POST /api/employee/upload-image/        # Upload profile image
  GET  /api/attachments/{id}/download/    # Secure attachment download
  GET  /media/{file_path}                 # Secure media serving (production)

File Access Patterns:
  Authenticated Users:
    - Authorization: Bearer {jwt_token}
    - URL Parameter: ?token={jwt_token}
  
  External Systems:
    - X-API-Key: {api_key}
    - URL Parameter: ?api_key={api_key}
```

#### File Processing Pipeline
```yaml
Upload Process:
  1. File validation (type, size, format)
  2. Security scanning (malware detection)
  3. Image processing (resize, optimization)
  4. Secure storage with unique naming
  5. Database record creation
  6. Secure URL generation

Access Process:
  1. Authentication validation
  2. Permission verification
  3. File existence check
  4. Content type determination
  5. Secure file streaming
  6. Access logging and audit
```

---

### 6. **Notification Service**
**Technology**: Gmail API + SMTP + Django Email  
**Purpose**: Multi-channel communication and alerts  
**Integration**: Gmail API and SMTP servers  

#### Service Responsibilities
```yaml
Core Functions:
  - Email notifications and alerts
  - Template-based message generation
  - Multi-channel communication
  - Delivery confirmation and tracking
  - Failed delivery handling
  - Notification preferences management

Notification Types:
  - Account creation confirmations
  - Account approval/rejection
  - Password reset instructions
  - Ticket status updates
  - System announcements
  - Security alerts
```

#### Email Service Architecture
```python
# Notification Service Components
notification/
├── gmail_utils.py       # Gmail API integration
├── email_templates.py   # HTML email templates
├── notification_handlers.py  # Event-driven notifications
├── delivery_tracking.py      # Delivery confirmation
└── preferences.py            # User notification preferences

# Gmail API Integration
def send_gmail_message(to, subject, body, is_html=False):
    """
    Send email using Gmail API with OAuth2 authentication
    """
    credentials = get_gmail_credentials()
    service = build('gmail', 'v1', credentials=credentials)
    
    message = create_email_message(to, subject, body, is_html)
    result = service.users().messages().send(
        userId='me', 
        body={'raw': message}
    ).execute()
    
    return result
```

#### Email Templates and Content
```python
# Email Template Examples
def send_account_pending_email(employee):
    """Generate account pending approval email"""
    template = """
    <html>
      <body style="background:#f6f8fa;padding:32px 0;">
        <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:10px;">
          <div style="padding:40px 32px;">
            <img src="{logo_url}" alt="SmartSupport Logo" style="width:90px;margin-bottom:24px;" />
            <div style="font-size:1.6rem;margin-bottom:28px;">
              Account Creation Pending Approval
            </div>
            <p>Hi {first_name},</p>
            <p>Thank you for signing up with MAP Active PH! Your account has been successfully created, 
               but is currently awaiting approval. You'll receive a confirmation email once your account 
               has been approved.</p>
            <p>Best regards,<br>MAP Active PH SmartSupport</p>
          </div>
        </div>
      </body>
    </html>
    """
    return template.format(
        logo_url="https://smartsupport-hdts-frontend.up.railway.app/MapLogo.png",
        first_name=employee.first_name
    )

def send_account_approved_email(employee):
    """Generate account approval email"""
    # Similar template structure for approved accounts

def send_password_reset_email(user, reset_link):
    """Generate password reset email"""
    # Template with secure reset link
```

#### Service Integration Points
```yaml
Notification Triggers:
  - Django model signals (post_save, pre_delete)
  - Manual administrative actions
  - Scheduled tasks and reminders
  - External system webhooks
  - User-initiated requests

Email Configuration:
  SMTP Settings:
    - Host: smtp.gmail.com
    - Port: 587
    - TLS: Required
    - Authentication: OAuth2 + App Passwords
  
  Gmail API Settings:
    - OAuth2 Scopes: gmail.send
    - Service Account: smartsupport-service
    - Token Management: Automatic refresh
```

---

### 7. **Background Processing Service**
**Technology**: Celery + Redis/RabbitMQ  
**Purpose**: Asynchronous task processing and workflow integration  
**Queue**: Redis-based message broker  

#### Service Responsibilities
```yaml
Core Functions:
  - Asynchronous task execution
  - External workflow integration
  - Long-running process management
  - Retry logic and error handling
  - Task scheduling and cron jobs
  - Resource-intensive operations

Task Categories:
  - Email sending and notifications
  - File processing and optimization
  - External API integrations
  - Report generation
  - Data synchronization
  - Cleanup and maintenance
```

#### Celery Service Architecture
```python
# Background Processing Components
background_processing/
├── celery.py            # Celery application configuration
├── tasks.py             # Task definitions
├── workflow_integration.py  # External system integration
├── schedulers.py        # Periodic tasks
└── monitoring.py        # Task monitoring and health checks

# Celery Configuration
from celery import Celery

app = Celery('ticket_service')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# Task Definitions
@shared_task(name='tickets.tasks.receive_ticket')
def push_ticket_to_workflow(ticket_data):
    """
    Send ticket data to external workflow system
    """
    try:
        external_api_url = settings.WORKFLOW_API_URL
        api_key = settings.EXTERNAL_SYSTEM_API_KEY
        
        response = requests.post(
            f"{external_api_url}/tickets/",
            json=ticket_data,
            headers={'X-API-Key': api_key}
        )
        
        if response.status_code == 201:
            logger.info(f"Ticket {ticket_data['ticket_id']} sent to workflow")
        else:
            logger.error(f"Failed to send ticket: {response.text}")
            
    except Exception as e:
        logger.error(f"Workflow integration error: {str(e)}")
        raise  # Celery will retry the task

@shared_task(name='send_ticket_status')
def update_ticket_status_from_queue(ticket_number, new_status):
    """
    Update ticket status from external system callback
    """
    try:
        ticket = Ticket.objects.get(ticket_number=ticket_number)
        ticket.status = new_status
        ticket.save()
        
        # Send notification to ticket owner
        send_status_update_notification.delay(ticket.id, new_status)
        
    except Ticket.DoesNotExist:
        logger.error(f"Ticket {ticket_number} not found for status update")
```

#### Task Queue Architecture
```yaml
Queue Configuration:
  Default Queue: TICKET_TASKS_PRODUCTION
  High Priority Queue: CRITICAL_TASKS
  Low Priority Queue: BACKGROUND_TASKS
  
Task Categories:
  Email Tasks:
    - send_welcome_email
    - send_approval_notification
    - send_password_reset
    - send_ticket_updates
  
  File Processing Tasks:
    - resize_profile_image
    - process_ticket_attachment
    - generate_report_pdf
    - cleanup_temp_files
  
  Integration Tasks:
    - push_ticket_to_workflow
    - sync_external_system_status
    - fetch_external_data
    - webhook_processing
  
  Maintenance Tasks:
    - cleanup_expired_tokens
    - archive_old_tickets
    - generate_analytics_reports
    - database_optimization
```

#### Event-Driven Task Triggering
```python
# Django Signal Integration
from django.db.models.signals import post_save
from django.dispatch import receiver

@receiver(post_save, sender=Ticket)
def send_ticket_to_workflow(sender, instance, created, **kwargs):
    """
    Automatically send approved tickets to external workflow
    """
    # Only trigger when status changes to "Open"
    if not created and instance.status == "Open":
        from .serializers import ticket_to_dict_for_external_systems
        ticket_data = ticket_to_dict_for_external_systems(instance)
        push_ticket_to_workflow.delay(ticket_data)

@receiver(post_save, sender=Employee)
def send_account_notification(sender, instance, created, **kwargs):
    """
    Send account-related notifications
    """
    if created and instance.status == 'Pending':
        send_account_pending_email.delay(instance.id)
    elif instance.status == 'Approved':
        send_account_approved_email.delay(instance.id)
```

---

### 8. **AI Chatbot Service**
**Technology**: OpenRouter API + GPT-4o-mini  
**Purpose**: Intelligent customer support and FAQ assistance  
**Integration**: External AI service with internal knowledge base  

#### Service Responsibilities
```yaml
Core Functions:
  - Natural language query processing
  - Context-aware response generation
  - FAQ knowledge base integration
  - Multi-turn conversation handling
  - Company-specific information retrieval
  - Escalation to human support

AI Capabilities:
  - FAQ answering about MAP Active Philippines
  - General support guidance
  - Ticket creation assistance
  - System navigation help
  - Policy and procedure information
```

#### Chatbot Service Architecture
```javascript
// AI Chatbot Components
chatbot_service/
├── EmployeeChatbot.jsx    # Main chatbot interface
├── faq_knowledge.js       # Company knowledge base
├── conversation_manager.js # Conversation state management
├── openrouter_client.js   # AI service integration
└── response_formatter.js  # Response processing

// OpenRouter Integration
const fetchOpenRouterResponse = async (userMessage) => {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: FAQ_SYSTEM_PROMPT },
          { role: "user", content: userMessage },
        ],
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || "Sorry, I couldn't get a response.";
  } catch (error) {
    return "Sorry, there was an error connecting to the support service.";
  }
};
```

#### Knowledge Base Integration
```javascript
// Company FAQ Knowledge Base
const faqs = [
  {
    question: "Who is the CEO of MAP Active Philippines?",
    answer: "Elizabeth Marcelo Tinio is the CEO of MAP Active Philippines."
  },
  {
    question: "Where is MAP ACTIVE PHILIPPINES INC. located?",
    answer: "MAP ACTIVE PHILIPPINES INC. is located at 19th, 20th and 21st Floors 1 Proscenium Estrella Drive corner JP Rizal Street, Rockwell Center, Makati, Metro Manila, 1211 Philippines"
  },
  {
    question: "What services does Map Active Philippines offer?",
    answer: "Map Active Philippines offers Recruitment Process Outsourcing (RPO), HR Consulting, Talent Acquisition, Executive Search, and HR Technology Solutions."
  },
  // Additional FAQ entries...
];

// System Prompt for AI
const FAQ_SYSTEM_PROMPT = `You are a helpful assistant for MAP Active Philippines SmartSupport system. 
Your role is to answer questions about the company, provide support guidance, and help users navigate the system.

Company Information:
${buildFAQPrompt(faqs)}

Guidelines:
- Provide accurate, helpful responses based on the FAQ knowledge
- If you don't know something specific, direct users to contact support
- Be professional and friendly
- Focus on MAP Active Philippines-related questions
- Help users understand how to use the SmartSupport system`;
```

#### Chatbot Features and Capabilities
```yaml
User Interface Features:
  - Real-time messaging interface
  - Typing indicators and status
  - Markdown response rendering
  - File attachment support (future)
  - Conversation history
  - Quick action buttons

AI Response Features:
  - Context-aware responses
  - Multi-turn conversation memory
  - Company-specific knowledge integration
  - Professional tone and language
  - Error handling and fallbacks
  - Response formatting and structuring

Integration Points:
  - Employee dashboard integration
  - Support ticket creation assistance
  - Navigation and feature guidance
  - FAQ and knowledge base queries
  - Escalation to human support
```

---

## Service Communication Patterns

### 1. **Synchronous Communication**
```yaml
HTTP REST APIs:
  - Frontend to Backend API calls
  - Service-to-service API requests
  - External system integrations
  - Real-time data retrieval

Communication Protocols:
  - HTTPS for all external communication
  - JSON for data exchange
  - JWT tokens for authentication
  - Standard HTTP status codes
```

### 2. **Asynchronous Communication**
```yaml
Message Queue Patterns:
  - Celery task queue for background processing
  - Django signals for event-driven actions
  - Email notification queues
  - File processing pipelines

Event-Driven Architecture:
  - Model lifecycle events (post_save, pre_delete)
  - User action triggers
  - External system webhooks
  - Scheduled task execution
```

### 3. **External Integration Patterns**
```yaml
Webhook Integration:
  - External workflow system callbacks
  - Status update notifications
  - Real-time data synchronization
  - Third-party service integration

API Gateway Pattern:
  - Centralized request routing
  - Authentication and authorization
  - Rate limiting and throttling
  - Request/response transformation
```

---

## Data Services

### 1. **Database Service**
**Technology**: PostgreSQL on Railway  
**Purpose**: Primary data persistence layer  

#### Database Architecture
```yaml
Database Schema:
  Core Tables:
    - core_employee (User management)
    - core_ticket (Ticket management)
    - core_ticketattachment (File attachments)
    - core_ticketcomment (Communication)
    - core_rejectedemployeeaudit (Audit trail)
  
  Indexes and Optimization:
    - Primary key indexes (automatic)
    - Foreign key indexes
    - Email uniqueness index
    - Company ID uniqueness index
    - Ticket number uniqueness index

Connection Management:
  - Django ORM connection pooling
  - Automatic connection retry
  - Connection timeout handling
  - Database migration management
```

### 2. **File Storage Service**
**Technology**: Railway Volume Storage  
**Purpose**: Persistent file storage with security  

#### Storage Architecture
```yaml
Storage Structure:
  /app/media/
  ├── employee_images/          # Profile pictures
  │   ├── default-profile.png   # Default image
  │   └── profile_*.jpg         # User uploads
  └── ticket_attachments/       # Ticket files
      ├── *.pdf                 # Documents
      ├── *.png, *.jpg          # Images
      └── *.xlsx, *.docx        # Office files

Security Features:
  - Token-based access control
  - File type validation
  - Size restrictions
  - Path traversal protection
  - External API key support
```

---

## External Integration Services

### 1. **Gmail Integration Service**
**Technology**: Gmail API + OAuth2  
**Purpose**: Email communication and notifications  

#### Integration Architecture
```yaml
Gmail API Configuration:
  OAuth2 Scopes: ['https://www.googleapis.com/auth/gmail.send']
  Client Credentials: Google Cloud Console
  Token Management: Automatic refresh
  Fallback: SMTP authentication

Email Features:
  - HTML email templates
  - Secure credential management
  - Delivery confirmation
  - Error handling and retry
  - Rate limiting compliance
```

### 2. **Workflow System Integration**
**Technology**: RESTful API + Celery Tasks  
**Purpose**: External workflow system communication  

#### Integration Pattern
```python
# Workflow Integration Service
class WorkflowIntegrationService:
    def __init__(self):
        self.api_url = settings.WORKFLOW_API_URL
        self.api_key = settings.EXTERNAL_SYSTEM_API_KEY
    
    def send_ticket_to_workflow(self, ticket_data):
        """Send ticket to external workflow system"""
        headers = {
            'X-API-Key': self.api_key,
            'Content-Type': 'application/json'
        }
        
        response = requests.post(
            f"{self.api_url}/tickets/",
            json=ticket_data,
            headers=headers
        )
        
        return response.status_code == 201
    
    def receive_status_update(self, ticket_number, new_status):
        """Receive status update from workflow system"""
        update_ticket_status_from_queue.delay(ticket_number, new_status)
```

### 3. **AI Service Integration**
**Technology**: OpenRouter API  
**Purpose**: Intelligent chatbot capabilities  

#### AI Service Configuration
```yaml
OpenRouter API:
  Model: gpt-4o-mini
  Endpoint: https://openrouter.ai/api/v1/chat/completions
  Authentication: Bearer token
  Rate Limits: Per API key limits
  Fallback: Static FAQ responses

Integration Features:
  - Context-aware conversations
  - Company knowledge integration
  - Error handling and fallbacks
  - Response formatting
  - Usage tracking and analytics
```

---

## Frontend Service Components

### 1. **Web Application Service**
**Technology**: React 19.1.0 + Vite  
**Purpose**: Single Page Application delivery  
**Port**: 80 (Nginx)  

#### Service Architecture
```yaml
Application Structure:
  src/
  ├── authentication/      # Authentication flows
  ├── employee/           # Employee portal
  ├── coordinator-admin/  # Admin portal
  ├── shared/            # Shared components
  └── utilities/         # Service utilities

Service Features:
  - Single Page Application (SPA)
  - Client-side routing
  - Responsive design
  - Progressive Web App ready
  - Real-time updates
  - Offline capabilities (future)
```

### 2. **Frontend Authentication Service**
**Technology**: JWT token management + localStorage  
**Purpose**: Client-side authentication state management  

#### Authentication Flow
```javascript
// Frontend Authentication Service
const authService = {
  // Employee authentication
  loginEmployee: async (email, password) => {
    const response = await fetch(`${API_URL}token/employee/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    
    if (response.ok) {
      const data = await response.json();
      localStorage.setItem('employee_access_token', data.access);
      localStorage.setItem('employee_refresh_token', data.refresh);
      return data;
    }
    throw new Error("Authentication failed");
  },
  
  // Admin authentication
  loginAdmin: async (email, password) => {
    // Similar implementation for admin login
  },
  
  // Token refresh
  refreshToken: async () => {
    // Automatic token refresh logic
  },
  
  // Logout
  logout: () => {
    localStorage.removeItem('employee_access_token');
    localStorage.removeItem('admin_access_token');
    // Clear other session data
  }
};
```

### 3. **Secure Media Client Service**
**Technology**: Custom JavaScript utilities  
**Purpose**: Secure file access from frontend  

#### Secure Media Implementation
```javascript
// Secure Media Client Service
export function generateSecureMediaUrl(filePath, token) {
  if (!filePath || !token) return null;
  
  const MEDIA_URL = import.meta.env.VITE_MEDIA_URL || 
    'https://smartsupport-hdts-backend.up.railway.app/media/';
  
  const cleanFilePath = filePath.startsWith('/') ? filePath.slice(1) : filePath;
  const baseUrl = `${MEDIA_URL}${cleanFilePath}`;
  const urlWithToken = `${baseUrl}?token=${encodeURIComponent(token)}`;
  
  return urlWithToken;
}

export async function downloadSecureFile(url, filename) {
  const token = getAccessToken();
  
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  if (!response.ok) throw new Error('Download failed');
  
  const blob = await response.blob();
  const downloadUrl = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename || 'download';
  document.body.appendChild(link);
  link.click();
  link.remove();
  
  window.URL.revokeObjectURL(downloadUrl);
}
```

---

## Infrastructure Services

### 1. **Container Orchestration Service**
**Technology**: Docker + Railway Platform  
**Purpose**: Application containerization and deployment  

#### Container Architecture
```yaml
Frontend Container:
  Base Image: node:20-alpine
  Build Stage: Vite production build
  Runtime Stage: nginx:alpine
  Port: 80
  Size: ~50MB

Backend Container:
  Base Image: python:3.10-slim
  Runtime: Gunicorn WSGI server
  Port: 8000
  Size: ~200MB
  
Container Features:
  - Multi-stage builds for optimization
  - Health check endpoints
  - Environment variable injection
  - Automatic restart on failure
  - Resource limits and monitoring
```

### 2. **Load Balancing and CDN Service**
**Technology**: Railway's built-in load balancing  
**Purpose**: High availability and performance  

#### Load Balancing Features
```yaml
Load Balancing:
  - Automatic request distribution
  - Health check monitoring
  - Failover handling
  - SSL termination
  - Geographic routing

CDN Features:
  - Static asset caching
  - Global edge locations
  - Automatic cache invalidation
  - Compression and optimization
  - DDoS protection
```

### 3. **SSL/TLS Service**
**Technology**: Let's Encrypt via Railway  
**Purpose**: Secure communication channels  

#### Security Configuration
```yaml
SSL/TLS Features:
  - Automatic certificate provisioning
  - Certificate renewal
  - HTTPS redirect enforcement
  - Security headers
  - TLS 1.3 support

Security Headers:
  - Strict-Transport-Security
  - Content-Security-Policy
  - X-Frame-Options
  - X-Content-Type-Options
  - Referrer-Policy
```

---

## Service Deployment Topology

### 1. **Production Deployment Architecture**
```
┌─────────────────────────────────────────────────────────────────┐
│                         Railway Platform                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │   Frontend      │  │    Backend      │  │   Database      │ │
│  │   Service       │  │    Service      │  │   Service       │ │
│  │                 │  │                 │  │                 │ │
│  │ nginx:alpine    │  │ python:3.10     │  │ PostgreSQL 14+  │ │
│  │ Port: 80        │  │ Port: 8000      │  │ Port: 5432      │ │
│  │ Domain:         │  │ Domain:         │  │ Private Network │ │
│  │ frontend.       │  │ backend.        │  │ Internal Only   │ │
│  │ railway.app     │  │ railway.app     │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│           │                     │                     │          │
│           └─────────────────────┼─────────────────────┘          │
│                                 │                                │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │                 Volume Storage                               │ │
│  │  /app/media/                                                │ │
│  │  ├── employee_images/                                       │ │
│  │  └── ticket_attachments/                                    │ │
│  └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 2. **Service Communication Flow**
```yaml
External User Request Flow:
  1. DNS Resolution (Railway CDN)
  2. SSL Termination (Let's Encrypt)
  3. Load Balancer (Railway)
  4. Frontend Service (Nginx)
  5. API Requests → Backend Service (Django)
  6. Database Queries (PostgreSQL)
  7. File Access → Secure Media Service
  8. Background Tasks → Celery Service

Internal Service Communication:
  - Frontend ↔ Backend: HTTPS REST API
  - Backend ↔ Database: PostgreSQL protocol
  - Backend ↔ File Storage: File system access
  - Backend ↔ Email Service: Gmail API
  - Backend ↔ AI Service: OpenRouter API
  - Backend ↔ Queue: Celery task queue
```

### 3. **Environment Configuration**
```yaml
Development Environment:
  - Local Docker containers
  - SQLite database (optional)
  - Local file storage
  - Debug mode enabled
  - Hot reload development servers

Production Environment:
  - Railway cloud services
  - PostgreSQL database
  - Volume-based file storage
  - Production optimization
  - SSL/TLS encryption
  - CDN and caching
```

---

## Service Dependencies

### 1. **Service Dependency Graph**
```yaml
Frontend Services:
  Web Application Service:
    - Depends on: Backend API Service
    - Provides: User interface
  
  Authentication Client Service:
    - Depends on: Backend Authentication Service
    - Provides: Token management
  
  Secure Media Client Service:
    - Depends on: File Management Service
    - Provides: Secure file access

Backend Services:
  API Gateway Service:
    - Depends on: Database Service
    - Provides: REST API endpoints
  
  Authentication Service:
    - Depends on: Database Service, User Management Service
    - Provides: JWT tokens, authorization
  
  User Management Service:
    - Depends on: Database Service, Notification Service
    - Provides: Employee CRUD operations
  
  Ticket Management Service:
    - Depends on: Database Service, File Management Service, Background Processing Service
    - Provides: Ticket lifecycle management
  
  File Management Service:
    - Depends on: Storage Service, Authentication Service
    - Provides: Secure file operations
  
  Notification Service:
    - Depends on: Gmail API, Background Processing Service
    - Provides: Email communications
  
  Background Processing Service:
    - Depends on: Message Queue, External Integration Service
    - Provides: Asynchronous task execution

External Services:
  Database Service:
    - Provider: Railway PostgreSQL
    - Dependency Level: Critical
  
  Storage Service:
    - Provider: Railway Volume Storage
    - Dependency Level: High
  
  Email Service:
    - Provider: Gmail API
    - Dependency Level: Medium
  
  AI Service:
    - Provider: OpenRouter API
    - Dependency Level: Low
```

### 2. **Critical Path Analysis**
```yaml
Critical Services (System Unavailable if Down):
  - API Gateway Service
  - Authentication Service
  - Database Service

High Priority Services (Major Features Unavailable):
  - User Management Service
  - Ticket Management Service
  - Web Application Service

Medium Priority Services (Some Features Unavailable):
  - File Management Service
  - Notification Service

Low Priority Services (Optional Features):
  - Background Processing Service
  - AI Chatbot Service
  - External Integration Service
```

### 3. **Failure Mode Analysis**
```yaml
Database Service Failure:
  Impact: Complete system unavailability
  Mitigation: Automatic backup and restore, database replication
  Recovery Time: 5-15 minutes

API Gateway Failure:
  Impact: Backend API unavailable
  Mitigation: Health checks, automatic restart, load balancing
  Recovery Time: 1-5 minutes

File Storage Failure:
  Impact: File uploads/downloads unavailable
  Mitigation: Volume redundancy, backup storage
  Recovery Time: 10-30 minutes

External Service Failures:
  Gmail API Failure:
    Impact: Email notifications unavailable
    Mitigation: Retry logic, fallback SMTP
    Recovery Time: Depends on provider

  AI Service Failure:
    Impact: Chatbot unavailable
    Mitigation: Fallback to static responses
    Recovery Time: Immediate fallback
```

---

## Scaling & Performance

### 1. **Horizontal Scaling Strategies**
```yaml
Frontend Services:
  Web Application Service:
    - Multiple container instances
    - CDN edge caching
    - Client-side caching
    - Lazy loading and code splitting

Backend Services:
  API Gateway Service:
    - Multiple worker processes
    - Load balancing across instances
    - Connection pooling
    - Response caching

  Database Service:
    - Read replicas for query distribution
    - Connection pooling
    - Query optimization
    - Index management

Current Scaling Capabilities:
  - Railway automatic scaling
  - Container instance scaling
  - Database connection scaling
  - CDN edge distribution
```

### 2. **Performance Optimization**
```yaml
Frontend Optimizations:
  - Vite build optimization
  - Component lazy loading
  - Image optimization
  - Bundle size reduction
  - Browser caching

Backend Optimizations:
  - Django ORM optimization
  - Database query efficiency
  - API response compression
  - File serving optimization
  - Background task processing

Database Optimizations:
  - Index optimization
  - Query plan analysis
  - Connection pooling
  - Prepared statements
  - Data archiving strategies
```

### 3. **Resource Monitoring**
```yaml
Performance Metrics:
  - Response time monitoring
  - Throughput measurement
  - Error rate tracking
  - Resource utilization
  - User experience metrics

Monitoring Tools:
  - Railway built-in monitoring
  - Django logging framework
  - Database performance metrics
  - Custom health check endpoints
  - User analytics tracking
```

---

## Security Services

### 1. **Authentication Security Service**
```yaml
Security Features:
  - JWT token-based authentication
  - Token rotation and blacklisting
  - Multi-factor authentication ready
  - Password strength enforcement
  - Account lockout protection

Implementation:
  - Django SimpleJWT integration
  - Custom authentication backends
  - Role-based access control
  - Session management
  - Security audit logging
```

### 2. **File Security Service**
```yaml
Security Features:
  - Token-based file access
  - Role-based file permissions
  - Path traversal protection
  - File type validation
  - Size restrictions

Implementation:
  - Custom secure media serving
  - JWT token validation
  - Permission checking
  - Access logging
  - External API key support
```

### 3. **Data Protection Service**
```yaml
Security Features:
  - HTTPS encryption
  - Database encryption at rest
  - Secure credential management
  - Data sanitization
  - Privacy controls

Implementation:
  - SSL/TLS enforcement
  - Environment variable security
  - Input validation and sanitization
  - SQL injection prevention
  - XSS protection
```

---

## Monitoring & Observability

### 1. **Application Monitoring Service**
```yaml
Monitoring Components:
  - Health check endpoints
  - Performance metrics collection
  - Error tracking and alerting
  - User activity monitoring
  - Resource utilization tracking

Implementation:
  - Django health checks
  - Custom metrics endpoints
  - Log aggregation
  - Performance profiling
  - Error reporting
```

### 2. **Infrastructure Monitoring**
```yaml
Infrastructure Metrics:
  - Container health monitoring
  - Database performance tracking
  - Network latency measurement
  - Storage utilization monitoring
  - CDN performance metrics

Tools:
  - Railway platform monitoring
  - Container orchestration metrics
  - Database monitoring tools
  - Network performance analysis
  - Custom alerting systems
```

### 3. **Security Monitoring**
```yaml
Security Monitoring:
  - Authentication attempt tracking
  - Access pattern analysis
  - Suspicious activity detection
  - Vulnerability scanning
  - Compliance monitoring

Implementation:
  - Security event logging
  - Anomaly detection
  - Audit trail maintenance
  - Incident response procedures
  - Regular security assessments
```

---

## Service Evolution Strategy

### 1. **Microservices Migration Path**
```yaml
Phase 1: Service Boundary Definition
  - Identify clear service boundaries
  - Extract shared libraries
  - Implement service interfaces
  - Create independent databases

Phase 2: Service Extraction
  - Extract User Management Service
  - Extract Notification Service
  - Extract File Management Service
  - Extract Background Processing Service

Phase 3: Service Optimization
  - Implement service discovery
  - Add circuit breakers
  - Implement distributed tracing
  - Add service mesh

Phase 4: Advanced Features
  - Event sourcing
  - CQRS patterns
  - Distributed caching
  - Advanced monitoring
```

### 2. **Technology Evolution**
```yaml
Frontend Evolution:
  - Progressive Web App features
  - Offline capabilities
  - Real-time updates via WebSockets
  - Mobile application development

Backend Evolution:
  - GraphQL API implementation
  - gRPC for internal communication
  - Advanced caching strategies
  - Machine learning integration

Infrastructure Evolution:
  - Kubernetes orchestration
  - Service mesh implementation
  - Advanced monitoring and observability
  - Multi-region deployment
```

### 3. **Service Decomposition Strategy**
```yaml
Candidates for Extraction:
  High Priority:
    - User Management Service (clear boundaries)
    - Notification Service (independent functionality)
    - File Management Service (separate concerns)

  Medium Priority:
    - Background Processing Service (already async)
    - External Integration Service (external dependencies)
    - AI Chatbot Service (separate AI concerns)

  Low Priority:
    - Authentication Service (tightly coupled)
    - API Gateway Service (cross-cutting concerns)
    - Database Service (shared data model)

Benefits of Decomposition:
  - Independent scaling
  - Technology diversity
  - Fault isolation
  - Team autonomy
  - Deployment independence
```

---

## Conclusion

The SmartSupport system demonstrates a well-architected service-oriented design that balances the simplicity of a monolithic deployment with the flexibility of microservices architecture. The clear service boundaries, comprehensive security implementation, and thoughtful integration patterns provide a solid foundation for both current operations and future evolution.

### Key Architectural Strengths

1. **Service-Oriented Design**: Clear separation of concerns with well-defined service boundaries
2. **Security-First Architecture**: Comprehensive authentication, authorization, and secure file handling
3. **Scalable Infrastructure**: Cloud-native deployment with horizontal scaling capabilities
4. **External Integration Ready**: Robust patterns for third-party service integration
5. **Event-Driven Patterns**: Asynchronous processing and workflow integration
6. **Modern Technology Stack**: Contemporary frameworks and tools with active community support

### Evolution Readiness

The system is architected to support future microservices decomposition while maintaining current operational efficiency. The clear service boundaries, well-defined APIs, and loose coupling between components provide multiple pathways for architectural evolution as business requirements grow and change.

This microservices documentation serves as a comprehensive guide for understanding, maintaining, and evolving the SmartSupport system's service architecture, enabling teams to make informed decisions about scaling, optimization, and future development directions.