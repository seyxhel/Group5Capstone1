# Component Diagram Draw.io Creation Guide

## Purpose
This guide helps you create professional component diagrams in Draw.io following Visual Paradigm UML component diagram standards for the SmartSupport application architecture.

---

## Step 1: Setting Up Draw.io

1. Open Draw.io (https://app.diagrams.net/)
2. Create a new diagram
3. Choose "Blank Diagram"
4. In the left panel, find and enable these shape libraries:
   - **UML** (for component shapes)
   - **Software** (for additional component icons)
   - **General** (for basic shapes and connectors)

---

## Step 2: Component Diagram Shapes & Notation

### Core Shapes to Use:

#### 1. Component Shape
- **Location**: UML library → Component
- **Shape**: Rectangle with small rectangle tab in upper right corner
- **Usage**: Represents each service/module (UserSvc, TicketSvc, etc.)
- **Label**: Place component name inside the rectangle

#### 2. Interface Shapes
- **Provided Interface (Ball/Lollipop)**: 
  - Shape: Circle connected to component with line
  - Location: UML library → Interface
  - Usage: Services the component offers to others

- **Required Interface (Socket/Cup)**: 
  - Shape: Semi-circle (cup shape) connected to component
  - Location: UML library → Required Interface
  - Usage: Services the component needs from others

#### 3. Connector Types
- **Dependency Arrow**: Solid line with arrow head
- **Interface Connection**: Line connecting provided interface to required interface
- **Assembly Connector**: Line connecting components that work together

### Visual Examples of Shapes:

```
┌─────────────────┐ ◯─── Provided Interface (what it offers)
│   Component     │
│     Name        │ ───╮ Required Interface (what it needs)  
└─────────────────┘    ╰
```

---

## Step 3: SmartSupport Component Layout

### Recommended Layout (Top to Bottom):

```
┌─────────────────────────────────────────────────┐
│                 Frontend Layer                  │
│  ┌──────────────┐  ┌──────────────┐            │
│  │  React SPA   │  │  Auth UI     │            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│                API Gateway Layer                │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Django API   │  │ JWT Middleware│            │
│  └──────────────┘  └──────────────┘            │
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│              Business Logic Layer               │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐│
│ │UserSvc  │ │TicketSvc│ │ AuthSvc │ │FileSvc  ││
│ └─────────┘ └─────────┘ └─────────┘ └─────────┘│
└─────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────┐
│                 Data Layer                      │
│ ┌─────────┐ ┌─────────┐ ┌─────────┐            │
│ │PostgreSQL│ │FileStore│ │  Redis  │            │
│ └─────────┘ └─────────┘ └─────────┘            │
└─────────────────────────────────────────────────┘
```

---

## Step 4: Creating Each Component

### For Each Service Component:

1. **Drag Component shape** from UML library
2. **Resize** to appropriate size (recommended: 120px width, 80px height)
3. **Label the component** (e.g., "User Management Service")
4. **Add provided interfaces** (circles):
   - UserSvc: `User.create()`, `User.read()`, `User.update()`
   - TicketSvc: `Ticket.create()`, `Ticket.update()`, `Ticket.query()`
   - AuthSvc: `Token.issue()`, `Token.validate()`
   - FileSvc: `File.upload()`, `File.getSecureUrl()`

5. **Add required interfaces** (sockets/cups):
   - UserSvc needs: `DB.userStore`, `EmailSvc.send()`
   - TicketSvc needs: `DB.ticketStore`, `FileSvc.store()`
   - AuthSvc needs: `DB.userStore`
   - FileSvc needs: `FileStore`, `AuthSvc.validate()`

### Component Details for SmartSupport:

#### Frontend Components:
```
┌────────────────┐
│   React SPA    │◯ UI.Render()
│                │◯ UI.Navigate()  
│                │╰ Auth.login()
│                │╰ TicketAPI.*
└────────────────┘
```

#### Backend Services:
```
┌────────────────┐
│  Auth Service  │◯ Token.issue()
│                │◯ Token.validate()
│                │╰ DB.userStore
└────────────────┘

┌────────────────┐
│ Ticket Service │◯ Ticket.create()
│                │◯ Ticket.update()
│                │╰ DB.ticketStore
│                │╰ FileSvc.store()
│                │╰ EmailSvc.queue()
└────────────────┘

┌────────────────┐
│  User Service  │◯ User.create()
│                │◯ User.read()
│                │◯ User.update()
│                │╰ DB.userStore
│                │╰ EmailSvc.send()
└────────────────┘

┌────────────────┐
│  File Service  │◯ File.upload()
│                │◯ File.getSecureUrl()
│                │╰ FileStore
│                │╰ AuthSvc.validate()
└────────────────┘

┌────────────────┐
│ Email Service  │◯ Email.send()
│                │◯ Email.queue()
│                │╰ SMTP/Gmail API
│                │╰ Queue (Celery)
└────────────────┘

┌────────────────┐
│Chat/AI Service │◯ Chat.complete()
│                │◯ Chat.summarize()
│                │╰ OpenRouter API
│                │╰ DB (logs)
└────────────────┘
```

---

## Step 5: Adding Connections

### Connection Steps:
1. **Select the Connector tool** from toolbar
2. **Choose connection type**:
   - **Dependency**: Solid arrow (Component A uses Component B)
   - **Interface Connection**: Line from provided interface (ball) to required interface (socket)

### Key Connections for SmartSupport:
- React SPA → Django API (REST calls)
- Django API → All Backend Services (service layer calls)
- All Services → Data Layer (data persistence)
- Email Service → Gmail API (external integration)
- Chat Service → OpenRouter API (external integration)
- Backend Services → Celery Workers (async tasks)

---

## Step 6: Styling & Formatting

### Recommended Colors:
- **Frontend Components**: Light Blue (#E3F2FD)
- **API Gateway**: Light Green (#E8F5E8)
- **Backend Services**: Light Orange (#FFF3E0)
- **Data Layer**: Light Purple (#F3E5F5)
- **External Services**: Light Gray (#F5F5F5)

### Text Formatting:
- **Component Names**: Bold, 12pt font
- **Interface Names**: Regular, 10pt font
- **Layer Labels**: Bold, 14pt font

---

## Step 7: Adding Interface Details

### For each Provided Interface (Ball):
1. **Right-click** on the interface circle
2. **Add label** with interface name (e.g., "User.create()")
3. **Position label** clearly near the interface

### For each Required Interface (Socket):
1. **Right-click** on the socket shape
2. **Add label** with dependency name (e.g., "DB.userStore")
3. **Position label** clearly near the interface

---

## Step 8: Final Touches

### Add Legend:
Create a small legend box explaining:
- ◯ = Provided Interface (what component offers)
- ╰ = Required Interface (what component needs)
- → = Dependency/Usage relationship

### Add Title:
- **Title**: "SmartSupport System - Component Architecture"
- **Subtitle**: "Visual Paradigm UML Component Diagram"
- **Date**: October 2025

---

## Export Options

### Recommended Export Settings:
- **Format**: SVG (for scalability) or PNG (for presentations)
- **Quality**: High DPI (300 DPI for print)
- **Size**: A3 or A4 landscape orientation
- **Background**: White

---

## Tips for Professional Results

1. **Consistent Spacing**: Keep uniform spacing between components
2. **Alignment**: Use Draw.io's alignment tools (View → Guides)
3. **Grouping**: Group related components using containers/swimlanes
4. **Layer Labels**: Add clear section headers for each layer
5. **Color Coding**: Use consistent colors for component types
6. **Interface Clarity**: Ensure interface labels don't overlap
7. **Connection Routing**: Use straight lines when possible, avoid crossing connections

---

**Created**: October 2025  
**For**: SmartSupport Component Architecture  
**Tool**: Draw.io (app.diagrams.net)  
**Standard**: Visual Paradigm UML Component Diagrams