# SmartSupport System - Data Architecture

## Table of Contents
1. [Overview](#overview)
2. [Data Sources and Types](#data-sources-and-types)
3. [Data Flow Diagrams](#data-flow-diagrams)
4. [Data Storage and Management](#data-storage-and-management)
5. [Data Synchronization Across Systems](#data-synchronization-across-systems)

---

## Overview

The SmartSupport Help Desk System implements a comprehensive data architecture designed to handle user management, ticket processing, file attachments, and system integrations. The architecture ensures data consistency, security, and efficient flow across all system components while maintaining ACID compliance and referential integrity.

**Data Architecture Philosophy**: Normalized relational design with strategic denormalization for performance  
**Data Consistency**: ACID-compliant transactions with foreign key constraints  
**Data Security**: Role-based access control with secure media handling  

---

## Data Sources and Types

### Primary Data Sources

| Data Source | Type | Format | Volume | Update Frequency | Retention Period |
|-------------|------|--------|--------|------------------|------------------|
| **Employee Registration** | User Input | JSON/Form Data | ~500 records | Daily | Permanent |
| **Ticket Submissions** | User Input | JSON/Multipart Form | ~1000 tickets/month | Real-time | 7 years |
| **File Attachments** | Binary Upload | PDF, Images, Documents | ~2GB/month | Real-time | 7 years |
| **System Logs** | Application Generated | Text/JSON | ~10MB/day | Continuous | 90 days |
| **Email Notifications** | External API | HTML/Text | ~500 emails/day | Event-driven | 30 days |
| **Audit Trail** | System Generated | JSON | ~1MB/day | Continuous | Permanent |

### Data Classification Matrix

```
                    SmartSupport Data Classification
    
    ┌─────────────────────────────────────────────────────────────────┐
    │                     Data Sensitivity Levels                     │
    │                                                                 │
    │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
    │  │   CONFIDENTIAL  │  │    INTERNAL     │  │     PUBLIC      │ │
    │  │                 │  │                 │  │                 │ │
    │  │ • Passwords     │  │ • Employee Data │  │ • Ticket Status │ │
    │  │ • Email Content │  │ • Ticket Details│  │ • Categories    │ │
    │  │ • API Keys      │  │ • File Metadata │  │ • Help Docs     │ │
    │  │ • JWT Tokens    │  │ • Comments      │  │ • FAQ Content   │ │
    │  │ • System Logs   │  │ • Audit Logs    │  │                 │ │
    │  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
    │                                                                 │
    │  Access Control:      Access Control:      Access Control:     │
    │  • System Admin      • Role-based          • Public Read       │
    │  • Encrypted Storage • JWT Authentication  • No Authentication │ │
    │  • Audit Logging     • Permission Checks   • Cacheable         │
    └─────────────────────────────────────────────────────────────────┘
```

### Structured Data Types

#### Employee Data Schema

```python
# Employee Entity Data Structure
Employee = {
    "id": "BigAutoField (Primary Key)",
    "personal_info": {
        "first_name": "CharField(100) - Required",
        "last_name": "CharField(100) - Required", 
        "middle_name": "CharField(100) - Optional",
        "suffix": "CharField(10) - Choices[Jr., Sr., III, IV, V, ...]"
    },
    "company_info": {
        "company_id": "CharField(6) - Unique - Format: MA0001-MA9999",
        "email": "EmailField - Unique - Business Email",
        "department": "CharField(100) - Choices[IT, Asset, Budget]",
        "role": "CharField(20) - Choices[Employee, Coordinator, Admin]"
    },
    "account_status": {
        "status": "CharField(10) - Choices[Pending, Approved, Rejected]",
        "is_active": "BooleanField - Default: True",
        "date_created": "DateTimeField - Auto Add",
        "last_login": "DateTimeField - Optional"
    },
    "profile_data": {
        "image": "ImageField - Upload to: employee_images/",
        "password": "CharField(128) - Hashed with bcrypt"
    },
    "permissions": {
        "is_staff": "BooleanField - Default: False",
        "is_superuser": "BooleanField - Default: False",
        "groups": "ManyToManyField - Django Auth Groups",
        "user_permissions": "ManyToManyField - Django Permissions"
    }
}
```

#### Ticket Data Schema

```python
# Ticket Entity Data Structure
Ticket = {
    "identification": {
        "id": "BigAutoField (Primary Key)",
        "ticket_number": "CharField(6) - Unique - Format: TX0001-TX9999",
        "employee": "ForeignKey(Employee) - Ticket Creator"
    },
    "ticket_content": {
        "subject": "CharField(255) - Ticket Title",
        "category": "CharField(100) - Main Category",
        "sub_category": "CharField(100) - Specific Sub-category",
        "description": "TextField - Detailed Description",
        "scheduled_date": "DateField - Optional Future Date"
    },
    "classification": {
        "priority": "CharField(20) - Choices[Critical, High, Medium, Low]",
        "department": "CharField(50) - Target Department",
        "status": "CharField(20) - Choices[New, Open, In Progress, ...]"
    },
    "workflow": {
        "assigned_to": "ForeignKey(Employee) - Assigned Staff Member",
        "submit_date": "DateTimeField - Auto Add",
        "update_date": "DateTimeField - Auto Update",
        "time_closed": "DateTimeField - Completion Time"
    },
    "metrics": {
        "response_time": "DurationField - Time to First Response",
        "resolution_time": "DurationField - Time to Resolution",
        "rejection_reason": "TextField - Optional Rejection Details"
    }
}
```

#### File Attachment Data Schema

```python
# Ticket Attachment Entity Data Structure
TicketAttachment = {
    "identification": {
        "id": "BigAutoField (Primary Key)",
        "ticket": "ForeignKey(Ticket) - Parent Ticket",
        "uploaded_by": "ForeignKey(Employee) - Uploader"
    },
    "file_metadata": {
        "file": "FileField - Upload to: ticket_attachments/",
        "file_name": "CharField(255) - Original Filename",
        "file_type": "CharField(100) - MIME Type",
        "file_size": "IntegerField - Size in Bytes"
    },
    "tracking": {
        "upload_date": "DateTimeField - Auto Add",
        "access_count": "IntegerField - Download Counter",
        "last_accessed": "DateTimeField - Last Download"
    }
}
```

### Unstructured Data Types

| Data Type | Source | Storage Method | Processing | Security |
|-----------|--------|----------------|------------|----------|
| **Profile Images** | Employee Upload | File System + Database Reference | Image resizing, format validation | Access token required |
| **Document Attachments** | Ticket Upload | File System + Metadata | Virus scanning, type validation | Role-based access |
| **Email Templates** | System Configuration | Database BLOB | Template rendering | Admin access only |
| **System Logs** | Application Events | Log Files + Database | Log aggregation, search indexing | Encrypted storage |
| **Backup Data** | Scheduled Exports | Compressed Archives | Automated backup scripts | Encrypted at rest |

---

## Data Flow Diagrams

### High-Level Data Flow Architecture

```
                    SmartSupport Data Flow Architecture
    
    ┌─────────────────────────────────────────────────────────────────┐
    │                        External Data Sources                    │
    │                                                                 │
    │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐            │
    │  │   Gmail     │  │ OpenRouter  │  │ External    │            │
    │  │    API      │  │     AI      │  │ Workflow    │            │
    │  │             │  │   Service   │  │   System    │            │
    │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘            │
    └─────────┼─────────────────┼─────────────────┼───────────────────┘
              │                 │                 │
              ▼                 ▼                 ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                     API Gateway Layer                           │
    │                   (Django REST Framework)                       │
    │                                                                 │
    │  ┌─────────────────────────────────────────────────────────┐   │
    │  │              Authentication & Authorization              │   │
    │  │                    (JWT Token Validation)               │   │
    │  └─────────────────────┬───────────────────────────────────┘   │
    └────────────────────────┼─────────────────────────────────────────┘
                             │
    ┌────────────────────────▼─────────────────────────────────────────┐
    │                    Business Logic Layer                         │
    │                      (Django Views)                             │
    │                                                                 │
    │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
    │  │   Employee      │  │     Ticket      │  │     File        │ │
    │  │  Management     │  │   Management    │  │   Management    │ │
    │  │   Service       │  │    Service      │  │    Service      │ │
    │  └─────────┬───────┘  └─────────┬───────┘  └─────────┬───────┘ │
    └────────────┼─────────────────────┼─────────────────────┼─────────┘
                 │                     │                     │
                 ▼                     ▼                     ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                      Data Access Layer                          │
    │                       (Django ORM)                              │
    │                                                                 │
    │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
    │  │    Employee     │  │     Ticket      │  │  File Storage   │ │
    │  │     Table       │  │     Table       │  │    Volume       │ │
    │  └─────────┬───────┘  └─────────┬───────┘  └─────────┬───────┘ │
    └────────────┼─────────────────────┼─────────────────────┼─────────┘
                 │                     │                     │
                 ▼                     ▼                     ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                     Persistence Layer                           │
    │                                                                 │
    │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
    │  │   PostgreSQL    │  │     Redis       │  │   File System   │ │
    │  │   Database      │  │ Message Queue   │  │   (Railway)     │ │
    │  │   (Railway)     │  │   (Railway)     │  │    Volume       │ │
    │  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
    └─────────────────────────────────────────────────────────────────┘
```

### Employee Registration Data Flow

```
    Employee Registration Data Flow

    [Employee] ──1. Submit Form──► [Frontend]
                                      │
                                      │ 2. Validate Client-side
                                      ▼
    [Email Service] ◄──5. Send────── [Backend API]
     Confirmation                      │
                                      │ 3. Server Validation
                                      ▼
    [Audit Log] ◄──6. Log────────── [Database]
     Activity                          │
                                      │ 4. Store Employee
                                      ▼
                              [Employee Table]
                                      │
                                      │ 7. Generate Company ID
                                      ▼
                              [Admin Dashboard]
                                      │
                                      │ 8. Approval Workflow
                                      ▼
                              [Status Update]

    Data Transformations:
    1. Form Data → JSON Object
    2. Client Validation → Error Messages
    3. Server Validation → Database Model
    4. Company ID Generation → MA#### Format
    5. Email Template → HTML Content
    6. Activity Logging → Audit Record
```

### Ticket Lifecycle Data Flow

```
    Ticket Processing Data Flow

    [Employee] ──1. Create Ticket──► [Ticket Form]
                                         │
                                         │ 2. File Upload
                                         ▼
    [File Storage] ◄──3. Store Files── [Backend API]
         │                               │
         │ 4. Generate URLs              │ 5. Create Ticket Record
         ▼                               ▼
    [Database] ──6. Ticket Number──► [Ticket Table]
         │                               │
         │ 7. Trigger Workflow           │ 8. Status: "New"
         ▼                               ▼
    [Celery Queue] ──9. Background──► [Admin Dashboard]
         │              Task              │
         │                               │ 10. Admin Approval
         ▼                               ▼
    [Email Service] ◄──11. Notify──── [Status: "Open"]
         │                               │
         │ 12. Send Confirmation         │ 13. External System
         ▼                               ▼
    [Employee] ◄──14. Updates──────── [Workflow API]

    Data States:
    • New → Submitted to system
    • Open → Admin approved, sent to workflow
    • In Progress → Being worked on
    • Resolved → Solution implemented
    • Closed → Ticket completed
```

### File Security Data Flow

```
    Secure File Access Data Flow

    [User Request] ──1. Download File──► [Frontend]
                                            │
                                            │ 2. JWT Token
                                            ▼
    [Authentication] ◄──3. Validate──── [Backend API]
          │                                │
          │ 4. User Verified               │ 5. Check Permissions
          ▼                                ▼
    [Database] ──6. File Metadata──► [Permission Check]
          │                                │
          │ 7. Access Granted              │ 8. Generate Secure URL
          ▼                                ▼
    [File Storage] ──9. Read File──► [Secure Response]
          │                                │
          │ 10. File Content               │ 11. Audit Log
          ▼                                ▼
    [User Download] ◄──12. Serve──── [Activity Log]

    Security Layers:
    • JWT Authentication
    • Role-based Authorization
    • File Permission Check
    • Secure URL Generation
    • Access Audit Logging
```

---

## Data Storage and Management

### Database Schema Design

#### Entity Relationship Diagram

```
                    SmartSupport Database Schema

    ┌─────────────────────────────────────────────────────────────────┐
    │                         Employee                                │
    │  ┌─────────────────────────────────────────────────────────┐   │
    │  │ PK  id: BigAutoField                                    │   │
    │  │     first_name: CharField(100)                          │   │
    │  │     last_name: CharField(100)                           │   │
    │  │     middle_name: CharField(100) NULL                    │   │
    │  │     suffix: CharField(10) NULL                          │   │
    │  │ UK  company_id: CharField(6) UNIQUE                     │   │
    │  │     department: CharField(100) [Choices]                │   │
    │  │ UK  email: EmailField UNIQUE                            │   │
    │  │     password: CharField(128) [Hashed]                   │   │
    │  │     image: ImageField NULL                              │   │
    │  │     role: CharField(20) [Choices] DEFAULT 'Employee'    │   │
    │  │     status: CharField(10) [Choices] DEFAULT 'Pending'   │   │
    │  │     is_active: BooleanField DEFAULT True                │   │
    │  │     date_created: DateTimeField AUTO_NOW_ADD            │   │
    │  └─────────────────────────────────────────────────────────┘   │
    └─────────────────────┬───────────────────┬───────────────────────┘
                          │                   │
                          │ 1:N               │ 1:N
                          ▼                   ▼
    ┌─────────────────────────────────────────────────────────────────┐
    │                         Ticket                                  │
    │  ┌─────────────────────────────────────────────────────────┐   │
    │  │ PK  id: BigAutoField                                    │   │
    │  │ UK  ticket_number: CharField(6) UNIQUE                  │   │
    │  │ FK  employee: ForeignKey(Employee) CASCADE              │   │
    │  │     subject: CharField(255)                             │   │
    │  │     category: CharField(100)                            │   │
    │  │     sub_category: CharField(100)                        │   │
    │  │     description: TextField                              │   │
    │  │     scheduled_date: DateField NULL                      │   │
    │  │     priority: CharField(20) [Choices] NULL              │   │
    │  │     department: CharField(50) [Choices] NULL            │   │
    │  │     status: CharField(20) [Choices] DEFAULT 'New'       │   │
    │  │     submit_date: DateTimeField AUTO_NOW_ADD             │   │
    │  │     update_date: DateTimeField AUTO_NOW                 │   │
    │  │ FK  assigned_to: ForeignKey(Employee) SET_NULL NULL     │   │
    │  │     response_time: DurationField NULL                   │   │
    │  │     resolution_time: DurationField NULL                 │   │
    │  │     time_closed: DateTimeField NULL                     │   │
    │  │     rejection_reason: TextField NULL                    │   │
    │  └─────────────────────────────────────────────────────────┘   │
    └─────────────────────┬───────────────────┬───────────────────────┘
                          │                   │
                          │ 1:N               │ 1:N
                          ▼                   ▼
    ┌─────────────────────────────────┐ ┌───────────────────────────────┐
    │        TicketAttachment         │ │        TicketComment          │
    │  ┌─────────────────────────┐   │ │  ┌───────────────────────┐   │
    │  │ PK  id: BigAutoField    │   │ │  │ PK  id: BigAutoField  │   │
    │  │ FK  ticket: ForeignKey  │   │ │  │ FK  ticket: ForeignKey│   │
    │  │     file: FileField     │   │ │  │ FK  user: ForeignKey  │   │
    │  │     file_name: Char(255)│   │ │  │     comment: TextField│   │
    │  │     file_type: Char(100)│   │ │  │     is_internal: Bool │   │
    │  │     file_size: Integer  │   │ │  │     created_at: DateTime│ │
    │  │     upload_date: DateTime│  │ │  └───────────────────────┘   │
    │  │ FK  uploaded_by: FK     │   │ └───────────────────────────────┘
    │  └─────────────────────────┘   │
    └─────────────────────────────────┘
    
    ┌─────────────────────────────────────────────────────────────────┐
    │                   RejectedEmployeeAudit                         │
    │  ┌─────────────────────────────────────────────────────────┐   │
    │  │ PK  id: BigAutoField                                    │   │
    │  │     first_name: CharField(100)                          │   │
    │  │     last_name: CharField(100)                           │   │
    │  │     email: EmailField                                   │   │
    │  │     company_id: CharField(100)                          │   │
    │  │     department: CharField(100)                          │   │
    │  │     rejected_at: DateTimeField AUTO_NOW_ADD             │   │
    │  │     reason: TextField NULL                              │   │
    │  └─────────────────────────────────────────────────────────┘   │
    └─────────────────────────────────────────────────────────────────┘
```

### Database Optimization Strategies

#### Indexing Strategy

```sql
-- Primary Indexes (Automatically Created)
CREATE UNIQUE INDEX employee_pkey ON employee(id);
CREATE UNIQUE INDEX ticket_pkey ON ticket(id);
CREATE UNIQUE INDEX ticketattachment_pkey ON ticketattachment(id);

-- Business Logic Indexes
CREATE UNIQUE INDEX employee_email_unique ON employee(email);
CREATE UNIQUE INDEX employee_company_id_unique ON employee(company_id);
CREATE UNIQUE INDEX ticket_number_unique ON ticket(ticket_number);

-- Performance Indexes
CREATE INDEX ticket_employee_id_idx ON ticket(employee_id);
CREATE INDEX ticket_assigned_to_id_idx ON ticket(assigned_to_id);
CREATE INDEX ticket_status_idx ON ticket(status);
CREATE INDEX ticket_submit_date_idx ON ticket(submit_date);
CREATE INDEX ticket_department_status_idx ON ticket(department, status);

-- Search Indexes
CREATE INDEX employee_name_search_idx ON employee(first_name, last_name);
CREATE INDEX ticket_subject_search_idx ON ticket USING gin(to_tsvector('english', subject));

-- Audit Trail Indexes
CREATE INDEX ticketcomment_ticket_id_idx ON ticketcomment(ticket_id);
CREATE INDEX ticketcomment_created_at_idx ON ticketcomment(created_at);
```

#### Database Constraints and Validation

```python
# Model-Level Constraints
class Employee(models.Model):
    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(company_id__regex=r'^MA\d{4}$'),
                name='valid_company_id_format'
            ),
            models.UniqueConstraint(
                fields=['email'], 
                name='unique_employee_email'
            ),
            models.CheckConstraint(
                check=models.Q(role__in=['Employee', 'Ticket Coordinator', 'System Admin']),
                name='valid_employee_role'
            )
        ]
        indexes = [
            models.Index(fields=['department', 'status']),
            models.Index(fields=['date_created']),
            models.Index(fields=['email']),
        ]

class Ticket(models.Model):
    class Meta:
        constraints = [
            models.CheckConstraint(
                check=models.Q(ticket_number__regex=r'^TX\d{4}$'),
                name='valid_ticket_number_format'
            ),
            models.CheckConstraint(
                check=models.Q(scheduled_date__gte=timezone.now().date()),
                name='future_scheduled_date'
            )
        ]
        indexes = [
            models.Index(fields=['employee', 'status']),
            models.Index(fields=['submit_date']),
            models.Index(fields=['assigned_to', 'status']),
            models.Index(fields=['department', 'priority']),
        ]
```

### File Storage Management

#### File Storage Architecture

```python
# File Storage Configuration
MEDIA_ROOT = '/app/media'  # Railway Volume Mount
MEDIA_URL = '/media/'

# Storage Structure
/app/media/
├── employee_images/
│   ├── MA0001_profile.jpg
│   ├── MA0002_profile.png
│   └── default-profile.png
├── ticket_attachments/
│   ├── TX0001_document.pdf
│   ├── TX0001_screenshot.png
│   ├── TX0002_spreadsheet.xlsx
│   └── TX0003_report.docx
└── system_backups/
    ├── daily_backup_2025-10-07.sql
    └── weekly_backup_2025-10-01.tar.gz
```

#### File Metadata Management

```python
# File Attachment Data Model
class TicketAttachment(models.Model):
    # File metadata stored in database
    file = models.FileField(
        upload_to='ticket_attachments/',
        validators=[
            FileExtensionValidator(allowed_extensions=[
                'pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv',
                'jpg', 'jpeg', 'png', 'gif', 'txt'
            ]),
            validate_file_size  # Max 10MB
        ]
    )
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)  # MIME type
    file_size = models.IntegerField()  # Bytes
    upload_date = models.DateTimeField(auto_now_add=True)
    
    # Security and tracking
    uploaded_by = models.ForeignKey(Employee, on_delete=models.SET_NULL, null=True)
    download_count = models.IntegerField(default=0)
    last_accessed = models.DateTimeField(null=True, blank=True)
    
    def save(self, *args, **kwargs):
        if self.file:
            self.file_size = self.file.size
            self.file_type = mimetypes.guess_type(self.file.name)[0]
            self.file_name = self.file.name
        super().save(*args, **kwargs)
```

### Data Backup and Recovery

#### Backup Strategy

| Backup Type | Frequency | Retention | Storage Location | Recovery Time |
|-------------|-----------|-----------|------------------|---------------|
| **Full Database Backup** | Daily 2 AM | 30 days | Railway Volumes + External | < 4 hours |
| **Incremental Database** | Every 6 hours | 7 days | Railway Volumes | < 1 hour |
| **File System Backup** | Daily 3 AM | 90 days | External Cloud Storage | < 2 hours |
| **Configuration Backup** | On deployment | 1 year | Git Repository | < 30 minutes |
| **Transaction Log Backup** | Every 15 minutes | 7 days | Local + Remote | < 15 minutes |

```bash
# Automated Backup Script
#!/bin/bash
# Daily Database Backup
pg_dump $DATABASE_URL > /app/backups/daily_backup_$(date +%Y-%m-%d).sql

# File System Backup
tar -czf /app/backups/media_backup_$(date +%Y-%m-%d).tar.gz /app/media/

# Upload to External Storage
aws s3 sync /app/backups/ s3://smartsupport-backups/$(date +%Y-%m-%d)/

# Cleanup old backups (older than 30 days)
find /app/backups/ -name "*.sql" -mtime +30 -delete
find /app/backups/ -name "*.tar.gz" -mtime +90 -delete
```

---

## Data Synchronization Across Systems

### Internal System Synchronization

#### Real-time Data Consistency

```python
# Django Signals for Real-time Synchronization
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver

@receiver(post_save, sender=Ticket)
def sync_ticket_status(sender, instance, created, **kwargs):
    """
    Synchronize ticket status across all system components
    """
    if created:
        # New ticket created
        tasks.send_new_ticket_notification.delay(instance.id)
        tasks.update_dashboard_stats.delay()
        
    elif instance.status == 'Open':
        # Ticket approved - send to external workflow
        tasks.push_ticket_to_workflow.delay(
            ticket_to_dict_for_external_systems(instance)
        )
        
    # Update real-time dashboard
    cache.delete(f'user_stats_{instance.employee.id}')
    cache.delete('admin_dashboard_stats')

@receiver(post_save, sender=Employee)
def sync_employee_approval(sender, instance, created, **kwargs):
    """
    Synchronize employee approval status
    """
    if not created and instance.status == 'Approved':
        # Send welcome email
        tasks.send_welcome_email.delay(instance.id)
        
    elif not created and instance.status == 'Rejected':
        # Log rejection and send notification
        RejectedEmployeeAudit.objects.create(
            first_name=instance.first_name,
            last_name=instance.last_name,
            email=instance.email,
            company_id=instance.company_id,
            department=instance.department,
            reason="Admin rejection"
        )
        tasks.send_rejection_notification.delay(instance.id)
```

### External System Integration

#### Workflow API Synchronization

```python
# External System Data Synchronization
class ExternalSystemSync:
    
    @staticmethod
    def sync_ticket_to_workflow(ticket_data):
        """
        Send ticket data to external workflow system
        """
        external_api_url = settings.EXTERNAL_WORKFLOW_API_URL
        api_key = settings.EXTERNAL_SYSTEM_API_KEY
        
        # Transform internal data to external format
        external_payload = {
            "ticket_id": ticket_data["ticket_id"],
            "customer": {
                "id": ticket_data["customer"]["company_id"],
                "name": f"{ticket_data['customer']['first_name']} {ticket_data['customer']['last_name']}",
                "email": ticket_data["customer"]["email"],
                "department": ticket_data["customer"]["department"]
            },
            "request": {
                "subject": ticket_data["subject"],
                "category": ticket_data["category"],
                "subcategory": ticket_data["subcategory"],
                "description": ticket_data["description"],
                "priority": ticket_data["priority"],
                "attachments": ticket_data["attachments"]
            },
            "metadata": {
                "source_system": "SmartSupport",
                "created_date": ticket_data["created_date"],
                "department": ticket_data["department"]
            }
        }
        
        try:
            response = requests.post(
                external_api_url,
                json=external_payload,
                headers={
                    'Authorization': f'Bearer {api_key}',
                    'Content-Type': 'application/json'
                },
                timeout=30
            )
            response.raise_for_status()
            return response.json()
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to sync ticket to workflow: {e}")
            # Retry mechanism
            sync_ticket_to_workflow.retry(countdown=300, max_retries=3)
```

#### Data Mapping and Transformation

```python
# Data Transformation Layer
class DataTransformer:
    
    @staticmethod
    def internal_to_external_format(ticket):
        """
        Transform internal ticket format to external system format
        """
        return {
            "ticket_id": ticket.ticket_number,
            "subject": ticket.subject,
            "category": ticket.category,
            "subcategory": ticket.sub_category,
            "description": ticket.description,
            "priority": ticket.priority or "Medium",
            "status": ticket.status,
            "created_date": ticket.submit_date.isoformat(),
            "department": ticket.department,
            "customer": {
                "id": ticket.employee.company_id,
                "first_name": ticket.employee.first_name,
                "last_name": ticket.employee.last_name,
                "email": ticket.employee.email,
                "department": ticket.employee.department,
                "image": f"{settings.MEDIA_URL_BASE}{ticket.employee.image.url}?api_key={settings.EXTERNAL_SYSTEM_API_KEY}"
            },
            "attachments": [
                {
                    "id": att.id,
                    "filename": att.file_name,
                    "type": att.file_type,
                    "size": att.file_size,
                    "url": f"{settings.MEDIA_URL_BASE}{att.file.url}?api_key={settings.EXTERNAL_SYSTEM_API_KEY}"
                }
                for att in ticket.attachments.all()
            ]
        }
    
    @staticmethod
    def external_to_internal_format(external_data):
        """
        Transform external system updates to internal format
        """
        status_mapping = {
            "ASSIGNED": "In Progress",
            "WORKING": "In Progress", 
            "COMPLETED": "Resolved",
            "CANCELLED": "Rejected"
        }
        
        return {
            "ticket_number": external_data.get("ticket_id"),
            "status": status_mapping.get(external_data.get("status"), "Open"),
            "assigned_to": external_data.get("assigned_technician"),
            "comments": external_data.get("work_notes", []),
            "resolution_notes": external_data.get("resolution"),
            "updated_date": external_data.get("last_modified")
        }
```

### Message Queue Synchronization

#### Celery Task Queue Management

```python
# Asynchronous Data Synchronization Tasks
from celery import shared_task
from celery.exceptions import Retry

@shared_task(bind=True, max_retries=3)
def sync_ticket_status_update(self, ticket_id, external_status):
    """
    Update ticket status from external system
    """
    try:
        ticket = Ticket.objects.get(id=ticket_id)
        
        # Transform external status to internal status
        status_mapping = {
            "ASSIGNED": "In Progress",
            "COMPLETED": "Resolved",
            "CANCELLED": "Rejected"
        }
        
        new_status = status_mapping.get(external_status, ticket.status)
        
        if new_status != ticket.status:
            ticket.status = new_status
            ticket.save()
            
            # Send notification to employee
            send_status_update_notification.delay(ticket.id)
            
            # Update dashboard statistics
            update_dashboard_stats.delay()
            
    except Ticket.DoesNotExist:
        logger.error(f"Ticket {ticket_id} not found for status update")
        
    except Exception as exc:
        logger.error(f"Failed to update ticket status: {exc}")
        raise self.retry(countdown=60, exc=exc)

@shared_task
def batch_sync_data():
    """
    Periodic batch synchronization with external systems
    """
    # Sync pending tickets
    pending_tickets = Ticket.objects.filter(
        status='Open',
        submit_date__gte=timezone.now() - timedelta(hours=24)
    )
    
    for ticket in pending_tickets:
        push_ticket_to_workflow.delay(
            ticket_to_dict_for_external_systems(ticket)
        )
    
    # Sync employee status updates
    pending_employees = Employee.objects.filter(
        status='Pending',
        date_created__gte=timezone.now() - timedelta(hours=24)
    )
    
    for employee in pending_employees:
        notify_admin_new_employee.delay(employee.id)
```

### Data Consistency Monitoring

#### Synchronization Health Checks

```python
# Data Consistency Monitoring
class DataConsistencyMonitor:
    
    @staticmethod
    def check_ticket_sync_status():
        """
        Verify ticket synchronization with external systems
        """
        issues = []
        
        # Check for tickets stuck in 'Open' status
        stuck_tickets = Ticket.objects.filter(
            status='Open',
            submit_date__lt=timezone.now() - timedelta(hours=2)
        )
        
        if stuck_tickets.exists():
            issues.append({
                'type': 'STUCK_TICKETS',
                'count': stuck_tickets.count(),
                'tickets': list(stuck_tickets.values_list('ticket_number', flat=True))
            })
        
        # Check for failed file uploads
        orphaned_attachments = TicketAttachment.objects.filter(
            upload_date__lt=timezone.now() - timedelta(minutes=30),
            file__isnull=True
        )
        
        if orphaned_attachments.exists():
            issues.append({
                'type': 'ORPHANED_ATTACHMENTS',
                'count': orphaned_attachments.count()
            })
        
        return issues
    
    @staticmethod
    def generate_sync_report():
        """
        Generate daily synchronization report
        """
        today = timezone.now().date()
        
        report = {
            'date': today.isoformat(),
            'tickets': {
                'created': Ticket.objects.filter(submit_date__date=today).count(),
                'synced': Ticket.objects.filter(
                    submit_date__date=today,
                    status__in=['Open', 'In Progress', 'Resolved']
                ).count(),
                'failed': Ticket.objects.filter(
                    submit_date__date=today,
                    status='New'
                ).count()
            },
            'employees': {
                'registered': Employee.objects.filter(date_created__date=today).count(),
                'approved': Employee.objects.filter(
                    date_created__date=today,
                    status='Approved'
                ).count(),
                'pending': Employee.objects.filter(
                    date_created__date=today,
                    status='Pending'
                ).count()
            },
            'files': {
                'uploaded': TicketAttachment.objects.filter(upload_date__date=today).count(),
                'total_size': TicketAttachment.objects.filter(
                    upload_date__date=today
                ).aggregate(total=Sum('file_size'))['total'] or 0
            }
        }
        
        return report
```

---

## Conclusion

The SmartSupport Data Architecture provides a comprehensive framework for managing all aspects of data within the help desk system. Key architectural strengths include:

1. **Structured Data Management**: Well-normalized relational database design with appropriate constraints and indexing
2. **Secure File Handling**: Token-based file access with comprehensive metadata tracking
3. **Real-time Synchronization**: Event-driven data synchronization across internal and external systems
4. **Data Consistency**: ACID compliance with foreign key constraints and validation rules
5. **Scalable Storage**: Efficient file storage with Railway volumes and cloud backup strategies
6. **Monitoring and Auditing**: Comprehensive data consistency monitoring and audit trail capabilities

The architecture supports current business requirements while providing flexibility for future data growth and integration needs.

---

**Document Version**: 1.0  
**Last Updated**: October 2025  
**Prepared By**: Data Architecture Team  
**Status**: Implementation Ready