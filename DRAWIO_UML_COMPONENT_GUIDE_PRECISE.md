# SmartSupport Component Diagram - Simple Draw.io Guide

## What You'll Create
A professional component diagram showing your SmartSupport system architecture with layers, services, and connections.

---

## Step 1: Setup
1. Open Draw.io (https://app.diagrams.net/)
2. Create new diagram → Blank Diagram
3. Make sure UML library is enabled (you should see Component, Package, Actor shapes)

---

## Step 2: Create the Layer Structure

**Create 4 Package containers (top to bottom):**

1. Drag **Package** shape → Label: "Frontend Layer"
2. Drag **Package** shape → Label: "API Gateway Layer" 
3. Drag **Package** shape → Label: "Business Logic Layer"
4. Drag **Package** shape → Label: "Data Layer"

**Make them large** (about 800px wide, 200px tall each) and **stack vertically**.

---

## Step 3: Add Components to Each Layer

### Frontend Layer (5 components):
Drag **Component** shapes into the Frontend Package:
- "React SPA"
- "Auth UI" 
- "Admin UI"
- "Ticket UI"
- "Chat Widget"

### API Gateway Layer (3 components):
- "Django REST API"
- "JWT Middleware"
- "CORS Handler"

### Business Logic Layer (6 components):
- "Auth Service"
- "User Service" 
- "Ticket Service"
- "File Service"
- "Email Service"
- "Chat/AI Service"

### Data Layer (3 components):
- "PostgreSQL"
- "File Storage"
- "Redis Cache"

**IMPORTANT: Change Component Stereotypes**
After adding all components, you need to change the stereotype from `<<Annotation>>` to `<<component>>`:
1. **Double-click each component**
2. **Change stereotype text** from "Annotation" to "component"
3. **Apply to all 17 components**

---

## Step 4: Add Interfaces (Detailed Labels for Each Component)

**For each Component, add circles (provided) and sockets (required) with these exact labels:**

### Frontend Layer Components:

**React SPA Component:**
- **Provided (circles)**: "Render", "Navigate", "StateManager"
- **Required (sockets)**: "Login", "APICalls", "Router"

**Auth UI Component:**
- **Provided (circles)**: "Login", "Register", "Logout"
- **Required (sockets)**: "AuthAPI", "Validation"

**Admin UI Component:**
- **Provided (circles)**: "UserMgmt", "TicketMgmt", "Reports"
- **Required (sockets)**: "AdminAPI", "Analytics"

**Ticket UI Component:**
- **Provided (circles)**: "Create", "Update", "Track"
- **Required (sockets)**: "TicketAPI", "FileAPI"

**Chat Widget Component:**
- **Provided (circles)**: "SendChat", "LoadHistory"
- **Required (sockets)**: "ChatAPI", "Storage"

### API Gateway Layer Components:

**Django REST API Component:**
- **Provided (circles)**: "AuthAPI", "TicketAPI", "UserAPI", "FileAPI"
- **Required (sockets)**: "AuthSvc", "TicketSvc", "UserSvc"

**JWT Middleware Component:**
- **Provided (circles)**: "ValidateToken", "RefreshToken", "UserContext"
- **Required (sockets)**: "AuthSvc"

**CORS Handler Component:**
- **Provided (circles)**: "AllowCORS", "Preflight"
- **Required (sockets)**: "Headers"

### Business Logic Layer Components:

**Auth Service Component:**
- **Provided (circles)**: "IssueToken", "ValidateToken", "AuthUser", "VerifyPass"
- **Required (sockets)**: "UserDB"

**User Service Component:**
- **Provided (circles)**: "CreateUser", "ReadUser", "UpdateUser", "ApproveUser"
- **Required (sockets)**: "UserDB", "EmailSvc"

**Ticket Service Component:**
- **Provided (circles)**: "CreateTicket", "UpdateTicket", "QueryTicket", "AssignTicket"
- **Required (sockets)**: "TicketDB", "FileSvc", "EmailSvc"

**File Service Component:**
- **Provided (circles)**: "UploadFile", "DownloadFile", "SecureFile", "ResizeImage"
- **Required (sockets)**: "FileStore", "AuthSvc"

**Email Service Component:**
- **Provided (circles)**: "SendEmail", "QueueEmail", "RenderTemplate"
- **Required (sockets)**: "GmailAPI", "CeleryQueue"

**Chat/AI Service Component:**
- **Provided (circles)**: "ChatComplete", "Summarize", "SearchFAQ"
- **Required (sockets)**: "OpenRouterAPI", "ChatDB"

### Data Layer Components:

**PostgreSQL Component:**
- **Provided (circles)**: "UserCRUD", "TicketCRUD", "CommentCRUD", "Reports"
- **Required (sockets)**: None (it's the data store)

**File Storage Component:**
- **Provided (circles)**: "StoreFiles", "ServeSecure", "CDNDeliver"
- **Required (sockets)**: "RailwayVolume"

**Redis Cache Component:**
- **Provided (circles)**: "SessionCache", "TokenCache", "JobQueue"
- **Required (sockets)**: None (it's the cache store)

**How to Add Each Interface:**
1. Drag **circle** shape from UML library → position on component edge → double-click → type label
2. Drag **socket** shape from UML library → position on component edge → double-click → type label
3. **Position**: Circles on right/top edges, Sockets on bottom/left edges

---

## Step 5: Add External Services (Exact Positioning)

**Add Actor shapes OUTSIDE your layer packages with these specific positions:**

### **Gmail API Actor:**
- **Position**: To the RIGHT of Business Logic Layer
- **Alignment**: Level with Email Service component
- **Distance**: About 100px to the right of Business Logic Layer boundary
- **Label**: "Gmail API"
- **Connection**: Will connect to Email Service's "GmailAPI" required socket

### **OpenRouter AI Actor:**
- **Position**: To the RIGHT of Business Logic Layer  
- **Alignment**: Level with Chat/AI Service component
- **Distance**: About 100px to the right of Business Logic Layer boundary
- **Label**: "OpenRouter AI"
- **Connection**: Will connect to Chat/AI Service's "OpenRouterAPI" required socket

### **Railway Platform Actor:**
- **Position**: To the RIGHT of Data Layer
- **Alignment**: Level with File Storage component
- **Distance**: About 100px to the right of Data Layer boundary
- **Label**: "Railway Platform"
- **Connection**: Will connect to File Storage's "RailwayVolume" required socket

### **Visual Layout Guide:**
```
┌─────────────┐                    
│Business Logic│  →  100px  →  👤 Gmail API
│   Layer     │               👤 OpenRouter AI
└─────────────┘                    

┌─────────────┐                    
│ Data Layer  │  →  100px  →  👤 Railway Platform
└─────────────┘                    
```

**How to Position:**
1. **Drag Actor shape** from UML library to the RIGHT side of your diagram
2. **Align vertically** with the related service component
3. **Keep consistent spacing** (~100px from layer boundary)
4. **Double-click Actor** to change label from "Actor" to service name

---

## Step 6: Connect Everything (Complete Connection Guide)

**Use Draw.io's connector tool to create these EXACT connections:**

### **1. Frontend to API Gateway Connections:**
- **Auth UI** "AuthAPI" socket → **Django REST API** "AuthAPI" circle
- **Admin UI** "AdminAPI" socket → **Django REST API** "UserAPI" circle
- **Ticket UI** "TicketAPI" socket → **Django REST API** "TicketAPI" circle
- **Ticket UI** "FileAPI" socket → **Django REST API** "FileAPI" circle
- **Chat Widget** "ChatAPI" socket → **Django REST API** "UserAPI" circle

### **2. API Gateway to Business Logic Connections:**
- **Django REST API** "AuthSvc" socket → **Auth Service** "ValidateToken" circle
- **Django REST API** "TicketSvc" socket → **Ticket Service** "CreateTicket" circle
- **Django REST API** "UserSvc" socket → **User Service** "CreateUser" circle
- **JWT Middleware** "AuthSvc" socket → **Auth Service** "IssueToken" circle

### **3. Business Logic Internal Connections:**
- **Ticket Service** "FileSvc" socket → **File Service** "UploadFile" circle
- **Ticket Service** "EmailSvc" socket → **Email Service** "SendEmail" circle
- **User Service** "EmailSvc" socket → **Email Service** "QueueEmail" circle
- **File Service** "AuthSvc" socket → **Auth Service** "ValidateToken" circle

### **4. Business Logic to Data Layer Connections:**
- **Auth Service** "UserDB" socket → **PostgreSQL** "UserCRUD" circle
- **User Service** "UserDB" socket → **PostgreSQL** "UserCRUD" circle
- **Ticket Service** "TicketDB" socket → **PostgreSQL** "TicketCRUD" circle
- **File Service** "FileStore" socket → **File Storage** "StoreFiles" circle
- **Chat/AI Service** "ChatDB" socket → **PostgreSQL** "CommentCRUD" circle

### **5. External Service Connections:**
- **Gmail API** Actor → **Email Service** "GmailAPI" socket
- **OpenRouter AI** Actor → **Chat/AI Service** "OpenRouterAPI" socket
- **Railway Platform** Actor → **File Storage** "RailwayVolume" socket

### **6. Background Service Connections:**
- **Email Service** "CeleryQueue" socket → **Redis Cache** "JobQueue" circle

### **How to Connect in Draw.io:**
1. **Select Connector Tool** from toolbar (or press 'C')
2. **Click on source interface** (provided circle or Actor)
3. **Drag to target interface** (required socket)
4. **Release to create connection**
5. **Choose "Line" style** (not arrow) for interface connections
6. **Keep connections straight** and avoid crossings when possible

### **Connection Types (Important):**
- **Simple lines** for ALL interface connections (circle → socket)
- **Simple lines** for Actor → component connections
- **No arrows** needed for interface relationships
- **Keep lines straight** and direct

---

## Step 7: Style Your Diagram

**Colors (Fill):**
- Frontend Layer: Light Blue (#E3F2FD)
- API Gateway: Light Green (#E8F5E8)
- Business Logic: Light Orange (#FFF3E0) 
- Data Layer: Light Purple (#F3E5F5)

**Text:**
- Component names: Bold, 11pt
- Interface labels: Regular, 9pt
- Layer titles: Bold, 14pt

---

## Step 8: Add Title & Legend

**Title:** "SmartSupport System - Component Architecture"

**Legend box:**
```
◯ = Provided Interface (what component offers)
╰ = Required Interface (what component needs)
→ = Dependency relationship
```

---

## Step 9: Export

**File → Export as → PNG**
- Quality: 300 DPI
- Size: A3 Landscape
- Background: White

---

**That's it!** You now have a professional component diagram showing your SmartSupport system architecture.