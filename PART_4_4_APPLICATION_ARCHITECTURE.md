# Part 4.4 - Application Architecture

## 4.4 Application Architecture

This section provides a comprehensive view of the SmartSupport application architecture, including component diagrams and detailed UML diagrams for key services.

---

## 4.4.1 Component Diagram (Show all services and their high-level interactions)

### System Overview Component Diagram

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[React SPA]
        Routes[React Router]
        Auth[Auth Components]
        Ticket[Ticket Components]
        Admin[Admin Components]
        Employee[Employee Components]
    end
    
    subgraph "API Gateway"
        API[Django REST API]
        JWT[JWT Middleware]
        CORS[CORS Handler]
    end
    
    subgraph "Business Logic Layer"
        UserSvc[User Management Service]
        TicketSvc[Ticket Management Service]
        AuthSvc[Authentication Service]
        FileSvc[File Management Service]
        EmailSvc[Email Service]
        ChatSvc[Chat/AI Service]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL Database)]
        Files[File Storage]
        Cache[Redis Cache]
    end
    
    subgraph "External Services"
        Gmail[Gmail API]
        OpenRouter[OpenRouter AI]
        Railway[Railway Platform]
    end
    
    subgraph "Background Services"
        Celery[Celery Workers]
        Scheduler[Task Scheduler]
    end
    
    UI --> Routes
    Routes --> Auth
    Routes --> Ticket
    Routes --> Admin
    Routes --> Employee
    
    Auth --> API
    Ticket --> API
    Admin --> API
    Employee --> API
    
    API --> JWT
    JWT --> CORS
    CORS --> UserSvc
    CORS --> TicketSvc
    CORS --> AuthSvc
    CORS --> FileSvc
    CORS --> EmailSvc
    CORS --> ChatSvc
    
    UserSvc --> DB
    TicketSvc --> DB
    AuthSvc --> DB
    FileSvc --> Files
    EmailSvc --> Gmail
    ChatSvc --> OpenRouter
    
    TicketSvc --> Celery
    EmailSvc --> Celery
    Celery --> Scheduler
    
    DB --> Cache
    Files --> Railway
```

### Service Interaction Matrix

| Service | User Mgmt | Ticket Mgmt | Auth | File Mgmt | Email | Chat/AI | Database | External APIs |
|---------|-----------|-------------|------|-----------|-------|---------|----------|---------------|
| **User Management** | - | Read | Full | None | Trigger | None | Read/Write | None |
| **Ticket Management** | Read | - | Required | Full | Trigger | Integration | Read/Write | Workflow API |
| **Authentication** | Full | Required | - | Required | None | Required | Read/Write | None |
| **File Management** | Required | Full | Required | - | None | None | Read/Write | Cloud Storage |
| **Email Service** | Read | Read | None | None | - | None | Read | Gmail API |
| **Chat/AI Service** | Read | Read | Required | None | None | - | Read | OpenRouter API |

### Component Dependencies

```
┌─────────────────────────────────────────────────────────────┐
│                    Component Dependencies                   │
├─────────────────────────────────────────────────────────────┤
│  Frontend Components                                       │
│  ├── Authentication Components                             │
│  │   ├── Login Form                                        │
│  │   ├── Registration Form                                 │
│  │   └── Password Reset                                    │
│  ├── Employee Dashboard                                    │
│  │   ├── Ticket Creation                                   │
│  │   ├── Ticket List                                       │
│  │   ├── Profile Management                                │
│  │   └── Chat Interface                                    │
│  └── Admin Dashboard                                       │
│      ├── User Management                                   │
│      ├── Ticket Management                                 │
│      ├── System Settings                                   │
│      └── Reports & Analytics                               │
│                                                             │
│  Backend Services                                          │
│  ├── Core Services                                         │
│  │   ├── User Service (CRUD operations)                    │
│  │   ├── Ticket Service (Lifecycle management)            │
│  │   ├── Authentication Service (JWT handling)            │
│  │   └── File Service (Upload/Download)                    │
│  ├── Integration Services                                  │
│  │   ├── Email Service (Gmail integration)                 │
│  │   ├── AI Service (OpenRouter integration)              │
│  │   └── Workflow Service (External system sync)          │
│  └── Infrastructure Services                               │
│      ├── Database Service (PostgreSQL operations)         │
│      ├── Cache Service (Redis operations)                 │
│      └── Background Task Service (Celery)                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 4.4.2 Detailed UML Diagrams for Key Services

### 4.4.2.1 Use Case Diagrams

#### Employee Use Cases

```mermaid
graph LR
    Employee((Employee))
    Admin((System Admin))
    Coordinator((Ticket Coordinator))
    System[SmartSupport System]
    
    Employee --> |submits| UC1[Create Ticket]
    Employee --> |views| UC2[View My Tickets]
    Employee --> |updates| UC3[Update Profile]
    Employee --> |chats| UC4[Use AI Chat]
    Employee --> |uploads| UC5[Upload Attachments]
    Employee --> |changes| UC6[Change Password]
    
    Admin --> |manages| UC7[Manage Users]
    Admin --> |approves| UC8[Approve Employees]
    Admin --> |configures| UC9[System Configuration]
    Admin --> |views| UC10[System Reports]
    
    Coordinator --> |processes| UC11[Process Tickets]
    Coordinator --> |assigns| UC12[Assign Tickets]
    Coordinator --> |updates| UC13[Update Ticket Status]
    Coordinator --> |communicates| UC14[Internal Communication]
    
    UC1 --> System
    UC2 --> System
    UC3 --> System
    UC4 --> System
    UC5 --> System
    UC6 --> System
    UC7 --> System
    UC8 --> System
    UC9 --> System
    UC10 --> System
    UC11 --> System
    UC12 --> System
    UC13 --> System
    UC14 --> System
```

#### Ticket Management Use Cases

```mermaid
graph TB
    subgraph "Ticket Lifecycle Use Cases"
        A[Create Ticket] --> B[Submit for Review]
        B --> C{Admin Review}
        C -->|Approve| D[Assign to Coordinator]
        C -->|Reject| E[Notify Employee]
        D --> F[Process Ticket]
        F --> G[Update Status]
        G --> H{Resolution?}
        H -->|Yes| I[Close Ticket]
        H -->|No| J[Continue Processing]
        J --> F
        E --> K[Employee Revises]
        K --> A
    end
    
    subgraph "Actors"
        Employee((Employee))
        Admin((Admin))
        Coordinator((Coordinator))
    end
    
    Employee --> A
    Admin --> C
    Coordinator --> F
    Coordinator --> G
```

### 4.4.2.2 Sequence Diagrams

#### Employee Ticket Creation Sequence

```mermaid
sequenceDiagram
    participant E as Employee
    participant UI as React Frontend
    participant API as Django API
    participant Auth as Auth Service
    participant TS as Ticket Service
    participant FS as File Service
    participant DB as Database
    participant Email as Email Service
    
    E->>UI: Fill ticket form
    E->>UI: Upload attachments
    E->>UI: Submit ticket
    
    UI->>API: POST /api/tickets/ (with files)
    API->>Auth: Validate JWT token
    Auth-->>API: Token valid
    
    API->>TS: Create ticket instance
    TS->>DB: Save ticket data
    DB-->>TS: Ticket ID returned
    
    alt Has attachments
        API->>FS: Process file uploads
        FS->>DB: Save file metadata
        FS-->>API: File URLs
    end
    
    TS->>Email: Trigger notification
    Email->>Email: Queue admin notification
    
    API-->>UI: Success response
    UI-->>E: Ticket created confirmation
    
    Note over Email: Background process
    Email->>Email: Send notification to admins
```

#### Authentication Flow Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant UI as React Frontend
    participant API as Django API
    participant Auth as Auth Service
    participant DB as Database
    participant JWT as JWT Service
    
    U->>UI: Enter credentials
    UI->>API: POST /api/token/employee/
    API->>Auth: Validate credentials
    Auth->>DB: Query user data
    DB-->>Auth: User record
    
    alt Valid credentials
        Auth->>JWT: Generate tokens
        JWT-->>Auth: Access & refresh tokens
        Auth-->>API: Token response
        API-->>UI: Success + tokens
        UI->>UI: Store tokens in localStorage
        UI->>API: GET /api/employee/profile/
        API->>Auth: Validate token
        Auth-->>API: Token valid
        API->>DB: Fetch user profile
        DB-->>API: Profile data
        API-->>UI: Profile response
        UI-->>U: Redirect to dashboard
    else Invalid credentials
        Auth-->>API: Authentication failed
        API-->>UI: Error response
        UI-->>U: Show error message
    end
```

### 4.4.2.3 Class Diagrams

#### Core Domain Model

```mermaid
classDiagram
    class Employee {
        +int id
        +string first_name
        +string last_name
        +string middle_name
        +string suffix
        +string email
        +string company_id
        +string department
        +string role
        +string status
        +ImageField image
        +datetime date_created
        +set_password(password)
        +check_password(password)
        +get_full_name()
    }
    
    class Ticket {
        +int id
        +string ticket_number
        +string subject
        +string category
        +string sub_category
        +text description
        +string priority
        +string department
        +string status
        +datetime submit_date
        +datetime update_date
        +JSONField dynamic_data
        +generate_ticket_number()
        +update_status(status)
        +assign_to(employee)
    }
    
    class TicketAttachment {
        +int id
        +FileField file
        +string file_name
        +string file_type
        +int file_size
        +datetime upload_date
        +get_file_url()
        +get_secure_url(token)
    }
    
    class TicketComment {
        +int id
        +text comment
        +boolean is_internal
        +datetime created_at
        +is_editable()
        +format_comment()
    }
    
    Employee ||--o{ Ticket : creates
    Employee ||--o{ Ticket : assigned_to
    Ticket ||--o{ TicketAttachment : has
    Ticket ||--o{ TicketComment : has
    Employee ||--o{ TicketComment : writes
    Employee ||--o{ TicketAttachment : uploads
```

#### Service Layer Architecture

```mermaid
classDiagram
    class AuthenticationService {
        +login(credentials)
        +logout()
        +refresh_token()
        +validate_token(token)
        +get_current_user()
    }
    
    class EmployeeService {
        +create_employee(data)
        +get_employee(id)
        +update_employee(id, data)
        +delete_employee(id)
        +get_all_employees()
        +approve_employee(id)
    }
    
    class TicketService {
        +create_ticket(data)
        +get_ticket(id)
        +update_ticket(id, data)
        +get_tickets_by_user(user_id)
        +assign_ticket(ticket_id, user_id)
        +update_status(ticket_id, status)
    }
    
    class FileService {
        +upload_file(file)
        +get_file(id)
        +delete_file(id)
        +get_secure_url(file_id, token)
        +process_image(image)
    }
    
    class EmailService {
        +send_notification(to, template, data)
        +send_ticket_notification(ticket)
        +send_approval_notification(employee)
        +queue_email(email_data)
    }
    
    class AIService {
        +chat_completion(messages)
        +generate_response(query)
        +analyze_ticket(ticket_data)
    }
    
    AuthenticationService --> EmployeeService
    TicketService --> EmployeeService
    TicketService --> FileService
    TicketService --> EmailService
    TicketService --> AIService
    FileService --> AuthenticationService
    EmailService --> AuthenticationService
```

### 4.4.2.4 Activity Diagrams

#### Ticket Processing Workflow

```mermaid
graph TD
    A[Employee Creates Ticket] --> B[System Validates Data]
    B --> C{Validation Success?}
    C -->|No| D[Show Validation Errors]
    D --> A
    C -->|Yes| E[Save Ticket to Database]
    E --> F[Generate Ticket Number]
    F --> G[Set Status to 'New']
    G --> H[Send Admin Notification]
    H --> I[Admin Reviews Ticket]
    I --> J{Admin Decision}
    J -->|Approve| K[Set Status to 'Open']
    J -->|Reject| L[Set Status to 'Rejected']
    K --> M[Assign to Coordinator]
    L --> N[Send Rejection Email]
    M --> O[Coordinator Claims Ticket]
    O --> P[Set Status to 'In Progress']
    P --> Q[Work on Resolution]
    Q --> R{Resolution Complete?}
    R -->|No| Q
    R -->|Yes| S[Set Status to 'Resolved']
    S --> T[Employee Confirms Resolution]
    T --> U{Employee Satisfied?}
    U -->|No| V[Reopen Ticket]
    V --> P
    U -->|Yes| W[Close Ticket]
    W --> X[Archive Ticket]
    N --> Y[Employee Can Revise]
    Y --> A
```

#### User Authentication Activity

```mermaid
graph TD
    A[User Enters Credentials] --> B[Frontend Validates Format]
    B --> C{Format Valid?}
    C -->|No| D[Show Format Error]
    D --> A
    C -->|Yes| E[Send Login Request]
    E --> F[Backend Validates Credentials]
    F --> G{Credentials Valid?}
    G -->|No| H[Return Auth Error]
    H --> I[Show Login Error]
    I --> A
    G -->|Yes| J[Check User Status]
    J --> K{Status Approved?}
    K -->|No| L[Return Status Error]
    L --> I
    K -->|Yes| M[Generate JWT Tokens]
    M --> N[Return Tokens to Frontend]
    N --> O[Store Tokens in LocalStorage]
    O --> P[Fetch User Profile]
    P --> Q[Store User Data]
    Q --> R{User Role?}
    R -->|Employee| S[Redirect to Employee Dashboard]
    R -->|Admin/Coordinator| T[Redirect to Admin Dashboard]
    S --> U[Load Dashboard Components]
    T --> U
```

---

## Key Architectural Patterns

### 1. **Model-View-Controller (MVC) Pattern**
- **Model**: Django models representing data structure
- **View**: React components for user interface
- **Controller**: Django REST API endpoints for business logic

### 2. **Repository Pattern**
- Service layer abstracts database operations
- Consistent data access patterns across services
- Easier testing and maintenance

### 3. **Authentication & Authorization Pattern**
- JWT-based stateless authentication
- Role-based access control (RBAC)
- Middleware-based security enforcement

### 4. **Observer Pattern**
- Event-driven notifications for ticket updates
- Email notifications triggered by state changes
- Real-time updates using WebSocket potential

### 5. **Strategy Pattern**
- Different handling strategies for various ticket types
- Pluggable file processing strategies
- Configurable notification strategies

---

## Performance Considerations

### Caching Strategy
- **Browser Caching**: Static assets cached for optimal load times
- **API Response Caching**: Frequently accessed data cached in Redis
- **Database Query Optimization**: Selective loading and indexing

### Scalability Patterns
- **Horizontal Scaling**: Load balancing across multiple instances
- **Vertical Scaling**: Resource allocation based on demand
- **Database Scaling**: Read replicas for query distribution

---

**Document Version**: 1.0  
**Last Updated**: October 2025  
**Prepared By**: Application Architecture Team  
**Status**: Complete