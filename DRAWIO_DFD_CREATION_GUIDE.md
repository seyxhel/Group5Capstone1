# SmartSupport Data Flow Diagram (DFD) - Draw.io Creation Guide

## Visual Paradigm Data Flow Diagram Standards Compliance

This document provides step-by-step instructions for creating professional Data Flow Diagrams in Draw.io following Visual Paradigm standards as outlined in their tutorial: https://www.visual-paradigm.com/tutorials/how-to-create-data-flow-diagram/

---

## DFD Overview and Visual Paradigm Standards

### Data Flow Diagram Components

Following Visual Paradigm DFD standards, our diagrams include these key elements:

1. **External Entities** (Squares/Rectangles) - Sources or destinations of data outside the system
2. **Processes** (Circles/Ellipses) - Activities that transform data
3. **Data Stores** (Open rectangles/D notation) - Storage of data
4. **Data Flows** (Arrows with labels) - Movement of data between components

### DFD Hierarchy Levels
- **Level 0 (Context Diagram)**: System overview with external entities
- **Level 1**: Major system processes and data stores
- **Level 2**: Detailed breakdown of specific processes

---

## Draw.io DFD Creation Guide

### **Step 1: Setup Draw.io Environment**

1. **Open Draw.io**: Go to https://app.diagrams.net/
2. **Create New Diagram**: Choose "Blank Diagram"
3. **Enable Required Libraries**:
   - Click "+ More Shapes" at bottom of shape panel
   - Enable these libraries:
     - ✅ **Flowchart** (for basic shapes and connectors)
     - ✅ **General** (for rectangles and text)
     - ✅ **Entity Relation** (for data store symbols) 
     - ✅ **Data Flow** (专用DFD符号库 - MOST IMPORTANT!)
     - ✅ **UML** (additional professional shapes)

### **DFD Shape Selection Guide from Data Flow Library:**

#### **External Entities (Data Sources/Destinations):**
- **Use**: Rectangle (square corners) from Data Flow library
- **Shape Description**: Clean rectangle - 2nd shape in your image
- **Visual Paradigm Standard**: External entities are always rectangles

#### **Processes (Data Transformation):**
- **Use**: Circle from Data Flow library  
- **Shape Description**: Perfect circle - 4th shape in your image
- **Visual Paradigm Standard**: Processes are always circles/ellipses

#### **Data Stores (Data at Rest):**
- **Use**: Open Rectangle from Data Flow library
- **Shape Description**: Rectangle with open left side - 3rd row, 2nd shape in your image
- **Alternative**: Use the "D" notation shape if available
- **Visual Paradigm Standard**: Open rectangles or D1, D2 notation

#### **Data Flows (Data Movement):**
- **Use**: Arrow connectors from Data Flow library
- **Shape Description**: Directed arrow - bottom right in your image
- **Visual Paradigm Standard**: Labeled arrows showing data direction

#### **Specialized DFD Shapes Available:**
- **Cylinder**: For database representation (2nd row, 2nd shape)
- **Document**: For file/report outputs (3rd row, 3rd shape) 
- **Cloud**: For external cloud services (bottom right cloud shape)
- **3D Box**: For external systems (3rd row, 4th shape)

### **How to Find the Data Flow Library:**

#### **Step-by-Step Library Access:**
1. **Open Shape Panel**: Look at the left sidebar in Draw.io
2. **Click "+ More Shapes"**: Located at the bottom of the shapes panel
3. **Search for "Data Flow"**: Type in the search box or scroll through categories
4. **Alternative Names**: May be listed as:
   - "Data Flow Diagram"
   - "DFD"
   - "Structured Analysis"
   - "Yourdon/DeMarco"

#### **If Data Flow Library Not Found:**
1. **Use Flowchart Library**: Contains circles for processes
2. **Use General Library**: Contains rectangles for entities
3. **Manual Data Store Creation**:
   - Use rectangle from General
   - Remove left border manually
   - Add "D1:", "D2:" labels

#### **Professional DFD Shape Mapping:**
| DFD Component | Primary Library | Backup Option | Shape Description |
|---------------|----------------|---------------|-------------------|
| **External Entity** | Data Flow | General | Rectangle (2nd shape in image) |
| **Process** | Data Flow | Flowchart | Circle (4th shape in image) |
| **Data Store** | Data Flow | General | Open Rectangle (modified) |
| **Data Flow** | Connectors | Flowchart | Labeled Arrow |

### **Step 2: Set Canvas and Grid**

#### **2.1 Canvas Configuration**
- **File** → **Page Setup**
- **Paper Size**: A3 Landscape (420 x 297 mm)
- **Grid**: Enable with 10px spacing
- **Background**: White

#### **2.2 Create Title Area**
- Add text box at top: "SmartSupport System - Data Flow Diagrams"
- **Font**: Bold, 18pt, centered
- **Position**: Top center of canvas

---

## Level 0 DFD (Context Diagram) Creation

### **Step 3: Create Level 0 Context Diagram**

#### **3.1 Add Central System Process**
1. **Drag Circle** from Flowchart library to center of canvas
2. **Size**: 150px diameter
3. **Label**: "SmartSupport Help Desk System"
4. **Style**:
   - **Fill Color**: Light Blue (#E3F2FD)
   - **Border**: 2px solid dark blue
   - **Font**: Bold, 12pt, centered

#### **3.2 Add External Entities**
Create these external entities as **rectangles** around the central process:

**External Entity 1: Employee**
- **Shape**: Rectangle from General library
- **Size**: 120px × 60px
- **Position**: Top-left of central process
- **Label**: "Employee"
- **Style**:
  - **Fill Color**: Light Gray (#F5F5F5)
  - **Border**: 2px solid black
  - **Font**: Bold, 11pt, centered

**External Entity 2: System Admin**
- **Shape**: Rectangle
- **Size**: 120px × 60px
- **Position**: Top-right of central process
- **Label**: "System Admin"
- **Style**: Same as Employee

**External Entity 3: Ticket Coordinator**
- **Shape**: Rectangle
- **Size**: 120px × 60px
- **Position**: Right side of central process
- **Label**: "Ticket Coordinator"
- **Style**: Same as Employee

**External Entity 4: Gmail Service**
- **Shape**: Rectangle
- **Size**: 120px × 60px
- **Position**: Bottom-left of central process
- **Label**: "Gmail Service"
- **Style**:
  - **Fill Color**: Light Orange (#FFF3E0)
  - **Border**: 2px solid orange
  - **Font**: Bold, 11pt, centered

**External Entity 5: AI Service**
- **Shape**: Rectangle
- **Size**: 120px × 60px
- **Position**: Bottom-right of central process
- **Label**: "AI Service"
- **Style**: Same as Gmail Service

**External Entity 6: File Storage**
- **Shape**: Rectangle
- **Size**: 120px × 60px
- **Position**: Left side of central process
- **Label**: "File Storage"
- **Style**: Same as Gmail Service

#### **3.3 Add Data Flows (Level 0)**
Create arrows with labels for data movement:

**Employee to System:**
1. **Arrow**: From Employee to Central System
2. **Label**: "Login Credentials"
3. **Style**: Solid arrow, 2px width, blue color

2. **Arrow**: From Employee to Central System
3. **Label**: "Ticket Requests"
4. **Style**: Solid arrow, 2px width, blue color

3. **Arrow**: From Employee to Central System
4. **Label**: "Profile Updates"
5. **Style**: Solid arrow, 2px width, blue color

**System to Employee:**
1. **Arrow**: From Central System to Employee
2. **Label**: "Authentication Response"
3. **Style**: Solid arrow, 2px width, green color

2. **Arrow**: From Central System to Employee
3. **Label**: "Ticket Status"
4. **Style**: Solid arrow, 2px width, green color

3. **Arrow**: From Central System to Employee
4. **Label**: "Email Notifications"
5. **Style**: Solid arrow, 2px width, green color

#### **System Admin Data Flows:**

**Admin to System:**
1. **Arrow**: From System Admin to Central System
2. **Label**: "User Management Commands"
3. **Style**: Solid arrow, 2px width, blue color

2. **Arrow**: From System Admin to Central System
3. **Label**: "System Configuration"
4. **Style**: Solid arrow, 2px width, blue color

3. **Arrow**: From System Admin to Central System
4. **Label**: "Report Requests"
5. **Style**: Solid arrow, 2px width, blue color

**System to Admin:**
1. **Arrow**: From Central System to System Admin
2. **Label**: "User Reports"
3. **Style**: Solid arrow, 2px width, green color

2. **Arrow**: From Central System to System Admin
3. **Label**: "System Status"
4. **Style**: Solid arrow, 2px width, green color

3. **Arrow**: From Central System to System Admin
4. **Label**: "Analytics Data"
5. **Style**: Solid arrow, 2px width, green color

#### **Ticket Coordinator Data Flows:**

**Coordinator to System:**
1. **Arrow**: From Ticket Coordinator to Central System
2. **Label**: "Ticket Processing"
3. **Style**: Solid arrow, 2px width, blue color

2. **Arrow**: From Ticket Coordinator to Central System
3. **Label**: "Status Updates"
4. **Style**: Solid arrow, 2px width, blue color

3. **Arrow**: From Ticket Coordinator to Central System
4. **Label**: "Assignment Actions"
5. **Style**: Solid arrow, 2px width, blue color

**System to Coordinator:**
1. **Arrow**: From Central System to Ticket Coordinator
2. **Label**: "Ticket Assignments"
3. **Style**: Solid arrow, 2px width, green color

2. **Arrow**: From Central System to Ticket Coordinator
3. **Label**: "Ticket Details"
4. **Style**: Solid arrow, 2px width, green color

3. **Arrow**: From Central System to Ticket Coordinator
4. **Label**: "Priority Alerts"
5. **Style**: Solid arrow, 2px width, green color

#### **Gmail Service Data Flows:**

**System to Gmail:**
1. **Arrow**: From Central System to Gmail Service
2. **Label**: "Email Requests"
3. **Style**: Solid arrow, 2px width, purple color

2. **Arrow**: From Central System to Gmail Service
3. **Label**: "Email Templates"
4. **Style**: Solid arrow, 2px width, purple color

3. **Arrow**: From Central System to Gmail Service
4. **Label**: "Recipient Lists"
5. **Style**: Solid arrow, 2px width, purple color

**Gmail to System:**
1. **Arrow**: From Gmail Service to Central System
2. **Label**: "Email Status"
3. **Style**: Solid arrow, 2px width, orange color

2. **Arrow**: From Gmail Service to Central System
3. **Label**: "Delivery Confirmation"
4. **Style**: Solid arrow, 2px width, orange color

3. **Arrow**: From Gmail Service to Central System
4. **Label**: "Error Reports"
5. **Style**: Solid arrow, 2px width, red color

#### **AI Service Data Flows:**

**System to AI:**
1. **Arrow**: From Central System to AI Service
2. **Label**: "Chat Queries"
3. **Style**: Solid arrow, 2px width, purple color

2. **Arrow**: From Central System to AI Service
3. **Label**: "Context Data"
4. **Style**: Solid arrow, 2px width, purple color

3. **Arrow**: From Central System to AI Service
4. **Label**: "User Preferences"
5. **Style**: Solid arrow, 2px width, purple color

**AI to System:**
1. **Arrow**: From AI Service to Central System
2. **Label**: "Chat Responses"
3. **Style**: Solid arrow, 2px width, orange color

2. **Arrow**: From AI Service to Central System
3. **Label**: "Suggested Actions"
4. **Style**: Solid arrow, 2px width, orange color

3. **Arrow**: From AI Service to Central System
4. **Label**: "Analysis Results"
5. **Style**: Solid arrow, 2px width, orange color

#### **File Storage Data Flows:**

**System to File Storage:**
1. **Arrow**: From Central System to File Storage
2. **Label**: "File Upload Requests"
3. **Style**: Solid arrow, 2px width, purple color

2. **Arrow**: From Central System to File Storage
3. **Label**: "File Metadata"
4. **Style**: Solid arrow, 2px width, purple color

3. **Arrow**: From Central System to File Storage
4. **Label**: "Access Permissions"
5. **Style**: Solid arrow, 2px width, purple color

**File Storage to System:**
1. **Arrow**: From File Storage to Central System
2. **Label**: "File Access URLs"
3. **Style**: Solid arrow, 2px width, orange color

2. **Arrow**: From File Storage to Central System
3. **Label**: "Storage Status"
4. **Style**: Solid arrow, 2px width, orange color

3. **Arrow**: From File Storage to Central System
4. **Label**: "File Retrieval Data"
5. **Style**: Solid arrow, 2px width, orange color

**Data Flow Labeling Instructions:**
1. **Right-click arrow** → **Edit Label**
2. **Font**: Regular, 9pt
3. **Position**: Center of arrow
4. **Background**: White with border for readability

#### **Data Flow Color Coding System:**
- **Blue Arrows**: Input data flows (user/admin to system)
- **Green Arrows**: Output data flows (system to users)
- **Purple Arrows**: External service requests (system to services)
- **Orange Arrows**: External service responses (services to system)
- **Red Arrows**: Error/exception flows

#### **Arrow Creation Tips:**
1. **Select Connector Tool**: Use arrow tool from toolbar
2. **Connect Shapes**: Click source shape, drag to target shape
3. **Curved Arrows**: For better visual separation, use curved connectors
4. **Avoid Crossings**: Route arrows to minimize line crossings
5. **Consistent Direction**: Keep similar flow types in same direction

#### **Label Positioning Best Practices:**
- **Place labels** near the middle of arrows
- **Avoid overlapping** with other labels or shapes
- **Use line breaks** for long labels (Shift+Enter)
- **Keep text horizontal** for readability
- **Add background** to labels for clarity against busy backgrounds

#### **Multiple Arrows Between Same Entities:**
When you have multiple data flows between the same two entities:
1. **Create separate arrows** for each data flow
2. **Slightly offset** parallel arrows
3. **Use different colors** based on flow direction
4. **Group related flows** visually by proximity
5. **Label each arrow** individually with specific data names

---

## Level 1 DFD (System Decomposition) Creation

### **Step 4: Create Level 1 DFD**

#### **4.1 Create New Page**
- **Right-click page tab** → **Insert Page**
- **Name**: "Level 1 DFD - System Processes"

#### **4.2 Add System Processes**
Create these **numbered circles** for major system processes:

**Process 1.0: User Authentication**
- **Shape**: Circle from Flowchart library
- **Size**: 100px diameter
- **Position**: Top-left area
- **Label**: "1.0\nUser Authentication"
- **Style**:
  - **Fill Color**: Light Blue (#E3F2FD)
  - **Border**: 2px solid blue
  - **Font**: Bold, 10pt, centered

**Process 2.0: User Management**
- **Shape**: Circle
- **Size**: 100px diameter
- **Position**: Top-center area
- **Label**: "2.0\nUser Management"
- **Style**: Same as Process 1.0

**Process 3.0: Ticket Management**
- **Shape**: Circle
- **Size**: 100px diameter
- **Position**: Center area
- **Label**: "3.0\nTicket Management"
- **Style**: Same as Process 1.0

**Process 4.0: File Management**
- **Shape**: Circle
- **Size**: 100px diameter
- **Position**: Center-right area
- **Label**: "4.0\nFile Management"
- **Style**: Same as Process 1.0

**Process 5.0: Notification Management**
- **Shape**: Circle
- **Size**: 100px diameter
- **Position**: Bottom-left area
- **Label**: "5.0\nNotification Management"
- **Style**: Same as Process 1.0

**Process 6.0: AI Chat Service**
- **Shape**: Circle
- **Size**: 100px diameter
- **Position**: Bottom-center area
- **Label**: "6.0\nAI Chat Service"
- **Style**: Same as Process 1.0

**Process 7.0: Reporting Service**
- **Shape**: Circle
- **Size**: 100px diameter
- **Position**: Bottom-right area
- **Label**: "7.0\nReporting Service"
- **Style**: Same as Process 1.0

#### **4.3 Add Data Stores**
Create **open rectangles** for data storage:

**Data Store D1: Employee Database**
- **Shape**: Rectangle from General library
- **Size**: 150px × 40px
- **Position**: Top area, between processes
- **Label**: "D1: Employee Database"
- **Style**:
  - **Fill Color**: Light Yellow (#FFFDE7)
  - **Border**: 2px solid on three sides (open on left)
  - **Font**: Bold, 10pt, centered

**Data Store D2: Ticket Database**
- **Shape**: Rectangle
- **Size**: 150px × 40px
- **Position**: Center area
- **Label**: "D2: Ticket Database"
- **Style**: Same as D1

**Data Store D3: Attachment Storage**
- **Shape**: Rectangle
- **Size**: 150px × 40px
- **Position**: Right area
- **Label**: "D3: Attachment Storage"
- **Style**: Same as D1

**Data Store D4: System Logs**
- **Shape**: Rectangle
- **Size**: 150px × 40px
- **Position**: Bottom area
- **Label**: "D4: System Logs"
- **Style**: Same as D1

#### **4.4 Add External Entities (Simplified)**
Add the same external entities from Level 0, positioned around the edges:
- Employee (top-left)
- Admin (top-right)
- Coordinator (right)
- Gmail Service (bottom-left)
- AI Service (bottom-right)

---

## **LEVEL 1 DFD POSITIONING GUIDE**

### **Optimal Component Layout for Professional Appearance**

Based on your created components, here's the exact positioning guide for Visual Paradigm compliance:

```
DRAW.IO CANVAS LAYOUT (A3 Landscape - 420mm x 297mm)
Grid coordinates shown for precise placement

     0    100   200   300   400   500   600   700   800   900  1000
  0  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
     │     │     │     │ SmartSupport System - Data Flow Diagrams │
 50  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
     │     │     │     │                                         │
100  │Employee   │           │           │           │System     │
     │     │     │  ┌─D1────┐│           │           │Admin      │
150  ├─────┼─────┼──│Employee│───────────┼─────D2────┼─────┬─────┤
     │     │ 1.0 │  │Database│           │ Ticket    │     │     │
200  │     │User │  └───────┘│    3.0    │ Database  │     │     │
     │     │Auth │           │  Ticket   │           │     │Ticket│
250  ├─────┼─────┼─────┬─────┼───Mgmt────┼─────┬─────┼─────┤Coord │
     │     │     │ 2.0 │     │           │ 4.0 │     │     │     │
300  │     │     │User │     │           │File │     │     │     │
     │     │     │Mgmt │     │           │Mgmt │     │     │     │
350  ├─────┼─────┼─────┼─────┼─────┬─────┼─────┼─────┼─────┼─────┤
     │     │     │     │     │     │     │     │     │     │     │
400  │     │     │     │D3───│─────┼─────│─────D4────│     │     │
     │     │     │     │Atch │     │     │ System    │     │     │
450  │Gmail│     │ 5.0 │Stor │ 6.0 │ 7.0 │ Logs      │     │     │
     │Serv │     │Notif│     │ AI  │Rept │           │     │     │
500  │     │     │Mgmt │     │Chat │Serv │           │     │     │
     │     │     │     │     │     │     │           │     │     │
550  ├─────┼─────┼─────┼─────┼─────┼─────┼───────────┼─────┼─────┤
     │     │     │     │     │     │     │           │     │     │
600  │           │           │ AI Service │           │           │
     └─────┴─────┴─────┴─────┴─────┴─────┴───────────┴─────┴─────┘
```

### **Precise Coordinate Positioning:**

#### **PROCESSES (Circles - 100px diameter):**
- **1.0 User Authentication**: (150, 200)
- **2.0 User Management**: (300, 300) 
- **3.0 Ticket Management**: (500, 250) - CENTER FOCAL POINT
- **4.0 File Management**: (700, 280)
- **5.0 Notification Management**: (200, 450)
- **6.0 AI Chat Service**: (450, 450)
- **7.0 Reporting Service**: (650, 450)

#### **DATA STORES (Open Rectangles - 150px × 40px):**
- **D1 Employee Database**: (250, 120) - Between Auth and User Mgmt
- **D2 Ticket Database**: (600, 150) - Near Ticket Management
- **D3 Attachment Storage**: (400, 400) - Between File and AI processes
- **D4 System Logs**: (550, 400) - Between AI and Reporting

#### **EXTERNAL ENTITIES (Rectangles - 120px × 60px):**
- **Employee**: (50, 100) - Top-left corner
- **System Administrator**: (800, 100) - Top-right corner  
- **Ticket Coordinator**: (850, 250) - Right side, aligned with Ticket Mgmt
- **Gmail Service**: (50, 450) - Bottom-left corner
- **AI Service**: (450, 550) - Bottom-center

### **Visual Balance Guidelines:**

#### **Horizontal Spacing:**
- **Process-to-Process**: Minimum 150px apart
- **Entity-to-Process**: Minimum 100px apart  
- **Data Store positioning**: Between related processes

#### **Vertical Layers:**
- **Layer 1 (Y: 100-150)**: External entities + D1, D2
- **Layer 2 (Y: 200-300)**: Primary processes (1.0, 2.0, 3.0, 4.0)
- **Layer 3 (Y: 400-450)**: Secondary processes + D3, D4  
- **Layer 4 (Y: 550)**: External services

#### **Central Focus Design:**
- **Process 3.0 (Ticket Management)** at center (500, 250)
- **All other processes** arranged around it
- **Data stores** positioned near accessing processes
- **External entities** on perimeter for clear system boundary

### **Connection Planning Zones:**

#### **Top Connection Zone** (Y: 50-180):
- Employee ↔ 1.0 ↔ D1 ↔ 2.0 ↔ System Admin
- Clean horizontal data flows

#### **Center Hub Zone** (Y: 200-350):
- 3.0 Ticket Management as central hub
- All processes connect through this zone
- D2 positioned for easy access

#### **Bottom Processing Zone** (Y: 400-500):
- Secondary processes (5.0, 6.0, 7.0)
- D3, D4 data stores
- External services integration

#### **Recommended Connection Patterns:**
1. **Horizontal flows**: For main user interactions
2. **Vertical flows**: For hierarchical data access  
3. **Diagonal flows**: For cross-process communication
4. **Curved arrows**: To avoid line crossings

This layout ensures:
- ✅ **Visual Paradigm compliance**
- ✅ **Minimal line crossings**  
- ✅ **Clear system boundaries**
- ✅ **Professional appearance**
- ✅ **Logical flow patterns**

#### **4.5 Create Data Flows (Level 1)**
Connect all processes with appropriate data flows:

#### **Process 1.0: User Authentication Data Flows**

**External Entity Connections:**
1. **Employee → Process 1.0**: "Login Request"
   - **Style**: Blue arrow, 2px width
2. **System Admin → Process 1.0**: "Admin Login"
   - **Style**: Blue arrow, 2px width
3. **Ticket Coordinator → Process 1.0**: "Coordinator Login"
   - **Style**: Blue arrow, 2px width

**Data Store Connections:**
4. **Process 1.0 → D1**: "User Lookup Query"
   - **Style**: Purple arrow, 1px width
5. **D1 → Process 1.0**: "User Credentials"
   - **Style**: Orange arrow, 1px width
6. **Process 1.0 → D4**: "Login Attempt Log"
   - **Style**: Purple arrow, 1px width

**Output Connections:**
7. **Process 1.0 → Employee**: "Auth Token"
   - **Style**: Green arrow, 2px width
8. **Process 1.0 → System Admin**: "Admin Session"
   - **Style**: Green arrow, 2px width
9. **Process 1.0 → Ticket Coordinator**: "Coordinator Session"
   - **Style**: Green arrow, 2px width

**Inter-Process Connections:**
10. **Process 1.0 → Process 2.0**: "Authenticated User"
    - **Style**: Blue arrow, 2px width
11. **Process 1.0 → Process 3.0**: "User Session"
    - **Style**: Blue arrow, 2px width

#### **Process 2.0: User Management Data Flows**

**External Entity Connections:**
1. **System Admin → Process 2.0**: "User Management Commands"
   - **Style**: Blue arrow, 2px width
2. **Employee → Process 2.0**: "Profile Update Request"
   - **Style**: Blue arrow, 2px width

**Data Store Connections:**
3. **Process 2.0 ↔ D1**: "Employee Data" (bidirectional)
   - **Style**: Purple arrows, 2px width each direction
4. **Process 2.0 → D4**: "User Management Log"
   - **Style**: Purple arrow, 1px width

**Output Connections:**
5. **Process 2.0 → System Admin**: "User Reports"
   - **Style**: Green arrow, 2px width
6. **Process 2.0 → Employee**: "Profile Update Confirmation"
   - **Style**: Green arrow, 2px width

**Inter-Process Connections:**
7. **Process 2.0 → Process 5.0**: "User Status Change"
   - **Style**: Blue arrow, 2px width

#### **Process 3.0: Ticket Management Data Flows**

**External Entity Connections:**
1. **Employee → Process 3.0**: "Ticket Creation Request"
   - **Style**: Blue arrow, 2px width
2. **Ticket Coordinator → Process 3.0**: "Ticket Processing"
   - **Style**: Blue arrow, 2px width
3. **System Admin → Process 3.0**: "Ticket Administration"
   - **Style**: Blue arrow, 2px width

**Data Store Connections:**
4. **Process 3.0 ↔ D2**: "Ticket Data" (bidirectional)
   - **Style**: Purple arrows, 2px width each direction
5. **Process 3.0 → D1**: "Employee Lookup"
   - **Style**: Purple arrow, 1px width
6. **D1 → Process 3.0**: "Employee Details"
   - **Style**: Orange arrow, 1px width
7. **Process 3.0 → D4**: "Ticket Activity Log"
   - **Style**: Purple arrow, 1px width

**Output Connections:**
8. **Process 3.0 → Employee**: "Ticket Status Updates"
   - **Style**: Green arrow, 2px width
9. **Process 3.0 → Ticket Coordinator**: "Ticket Assignments"
   - **Style**: Green arrow, 2px width
10. **Process 3.0 → System Admin**: "Ticket Analytics"
    - **Style**: Green arrow, 2px width

**Inter-Process Connections:**
11. **Process 3.0 → Process 4.0**: "Attachment Request"
    - **Style**: Blue arrow, 2px width
12. **Process 3.0 → Process 5.0**: "Notification Trigger"
    - **Style**: Blue arrow, 2px width
13. **Process 3.0 → Process 6.0**: "AI Chat Context"
    - **Style**: Blue arrow, 2px width
14. **Process 3.0 → Process 7.0**: "Ticket Metrics"
    - **Style**: Blue arrow, 2px width

#### **Process 4.0: File Management Data Flows**

**External Entity Connections:**
1. **File Storage → Process 4.0**: "File Access URLs"
   - **Style**: Orange arrow, 2px width
2. **File Storage → Process 4.0**: "Storage Status"
   - **Style**: Orange arrow, 2px width

**Data Store Connections:**
3. **Process 4.0 ↔ D3**: "File Metadata" (bidirectional)
   - **Style**: Purple arrows, 2px width each direction
4. **Process 4.0 → D4**: "File Activity Log"
   - **Style**: Purple arrow, 1px width

**Output Connections:**
5. **Process 4.0 → File Storage**: "File Upload Requests"
   - **Style**: Purple arrow, 2px width
6. **Process 4.0 → File Storage**: "Access Permissions"
   - **Style**: Purple arrow, 2px width

**Inter-Process Connections:**
7. **Process 4.0 → Process 3.0**: "File Attachment Confirmation"
   - **Style**: Green arrow, 2px width

#### **Process 5.0: Notification Management Data Flows**

**External Entity Connections:**
1. **Gmail Service → Process 5.0**: "Email Status"
   - **Style**: Orange arrow, 2px width
2. **Gmail Service → Process 5.0**: "Delivery Confirmation"
   - **Style**: Orange arrow, 2px width

**Data Store Connections:**
3. **Process 5.0 → D1**: "Recipient Lookup"
   - **Style**: Purple arrow, 1px width
4. **D1 → Process 5.0**: "User Contact Info"
   - **Style**: Orange arrow, 1px width
5. **Process 5.0 → D4**: "Notification Log"
   - **Style**: Purple arrow, 1px width

**Output Connections:**
6. **Process 5.0 → Gmail Service**: "Email Requests"
   - **Style**: Purple arrow, 2px width
7. **Process 5.0 → Gmail Service**: "Email Templates"
   - **Style**: Purple arrow, 2px width

**Inter-Process Connections:**
8. **Process 5.0 → Process 3.0**: "Notification Status"
   - **Style**: Green arrow, 2px width

#### **Process 6.0: AI Chat Service Data Flows**

**External Entity Connections:**
1. **AI Service → Process 6.0**: "Chat Responses"
   - **Style**: Orange arrow, 2px width
2. **AI Service → Process 6.0**: "Analysis Results"
   - **Style**: Orange arrow, 2px width

**Data Store Connections:**
3. **Process 6.0 → D2**: "Ticket Context Query"
   - **Style**: Purple arrow, 1px width
4. **D2 → Process 6.0**: "Ticket History"
   - **Style**: Orange arrow, 1px width
5. **Process 6.0 → D4**: "AI Interaction Log"
   - **Style**: Purple arrow, 1px width

**Output Connections:**
6. **Process 6.0 → AI Service**: "Chat Queries"
   - **Style**: Purple arrow, 2px width
7. **Process 6.0 → AI Service**: "Context Data"
   - **Style**: Purple arrow, 2px width

**Inter-Process Connections:**
8. **Process 6.0 → Process 3.0**: "AI Suggestions"
   - **Style**: Green arrow, 2px width

#### **Process 7.0: Reporting Service Data Flows**

**Data Store Connections:**
1. **Process 7.0 → D1**: "User Statistics Query"
   - **Style**: Purple arrow, 1px width
2. **D1 → Process 7.0**: "User Analytics Data"
   - **Style**: Orange arrow, 1px width
3. **Process 7.0 → D2**: "Ticket Statistics Query"
   - **Style**: Purple arrow, 1px width
4. **D2 → Process 7.0**: "Ticket Analytics Data"
   - **Style**: Orange arrow, 1px width
5. **Process 7.0 → D4**: "System Log Query"
   - **Style**: Purple arrow, 1px width
6. **D4 → Process 7.0**: "Activity Logs"
   - **Style**: Orange arrow, 1px width

**Output Connections:**
7. **Process 7.0 → System Admin**: "System Reports"
   - **Style**: Green arrow, 2px width
8. **Process 7.0 → Ticket Coordinator**: "Performance Reports"
   - **Style**: Green arrow, 2px width

#### **Data Flow Summary for Level 1:**
- **Total Data Flows**: 65 arrows
- **External Entity Flows**: 18 arrows
- **Data Store Flows**: 32 arrows (16 bidirectional pairs)
- **Inter-Process Flows**: 15 arrows
- **Color Coding**: Blue (inputs), Green (outputs), Purple (to services/stores), Orange (from services/stores)

---

## Level 2 DFD (Detailed Process) Creation

### **Step 5: Create Level 2 DFD for Ticket Management**

#### **5.1 Create New Page**
- **Right-click page tab** → **Insert Page**
- **Name**: "Level 2 DFD - Ticket Management Detail"

#### **5.2 Add Detailed Sub-processes**
Break down Process 3.0 into detailed sub-processes following Visual Paradigm standards:

**Process 3.1: Create Ticket**
- **Shape**: Circle from Data Flow library
- **Size**: 80px diameter
- **Label**: "3.1\nCreate Ticket"
- **Position**: Top-left (150, 150)
- **Style**:
  - **Fill Color**: Light Blue (#E3F2FD)
  - **Border**: 2px solid blue
  - **Font**: Bold, 9pt, centered

**Process 3.2: Validate Ticket**
- **Shape**: Circle from Data Flow library
- **Size**: 80px diameter
- **Label**: "3.2\nValidate Ticket"
- **Position**: Top-center (350, 150)
- **Style**: Same as Process 3.1

**Process 3.3: Route Ticket**
- **Shape**: Circle from Data Flow library
- **Size**: 80px diameter
- **Label**: "3.3\nRoute Ticket"
- **Position**: Top-right (550, 150)
- **Style**: Same as Process 3.1

**Process 3.4: Process Ticket**
- **Shape**: Circle from Data Flow library
- **Size**: 80px diameter
- **Label**: "3.4\nProcess Ticket"
- **Position**: Center-left (200, 300)
- **Style**: Same as Process 3.1

**Process 3.5: Update Status**
- **Shape**: Circle from Data Flow library
- **Size**: 80px diameter
- **Label**: "3.5\nUpdate Status"
- **Position**: Center-right (500, 300)
- **Style**: Same as Process 3.1

**Process 3.6: Close Ticket**
- **Shape**: Circle from Data Flow library
- **Size**: 80px diameter
- **Label**: "3.6\nClose Ticket"
- **Position**: Bottom-center (350, 450)
- **Style**: Same as Process 3.1

#### **5.3 Add Detailed Data Stores**
Include relevant data stores with precise positioning for Level 2 DFD:

**Data Store D1: Employee Database**
- **Shape**: Open Rectangle from Data Flow library
- **Size**: 120px × 35px
- **Position**: Top area (250, 80)
- **Label**: "D1: Employee Database"
- **Style**:
  - **Fill Color**: Light Yellow (#FFFDE7)
  - **Border**: 2px solid on three sides (open on left)
  - **Font**: Bold, 9pt, centered

**Data Store D2: Ticket Database**
- **Shape**: Open Rectangle from Data Flow library
- **Size**: 120px × 35px
- **Position**: Center area (400, 220)
- **Label**: "D2: Ticket Database"
- **Style**: Same as D1

**Data Store D3: Attachment Storage**
- **Shape**: Open Rectangle from Data Flow library
- **Size**: 120px × 35px
- **Position**: Right area (600, 280)
- **Label**: "D3: Attachment Storage"
- **Style**: Same as D1

**Data Store D4: Category Rules**
- **Shape**: Open Rectangle from Data Flow library
- **Size**: 120px × 35px
- **Position**: Left area (100, 200)
- **Label**: "D4: Category Rules"
- **Style**: Same as D1

**Data Store D5: Workflow Rules**
- **Shape**: Open Rectangle from Data Flow library
- **Size**: 120px × 35px
- **Position**: Bottom area (300, 380)
- **Label**: "D5: Workflow Rules"
- **Style**: Same as D1

#### **5.4 Add External Entities**
Position external entities around the perimeter following Visual Paradigm standards:

**Employee**
- **Shape**: Rectangle from Data Flow library
- **Size**: 100px × 50px
- **Position**: Top-left (50, 120)
- **Style**: Light Gray (#F5F5F5), 2px solid black border

**Ticket Coordinator**
- **Shape**: Rectangle from Data Flow library
- **Size**: 100px × 50px
- **Position**: Right side (650, 350)
- **Style**: Same as Employee

**System Admin**
- **Shape**: Rectangle from Data Flow library
- **Size**: 100px × 50px
- **Position**: Top-right (600, 80)
- **Style**: Same as Employee

---

## **LEVEL 2 DFD POSITIONING GUIDE**

### **Ticket Management Sub-Process Layout (Process 3.0 Decomposition)**

```
LEVEL 2 DFD LAYOUT - Ticket Management Detail (A3 Landscape)
Precise positioning for 6 sub-processes + 5 data stores + 3 external entities

     0    100   200   300   400   500   600   700   800
  0  ┌─────┬─────┬─────┬─────┬─────┬─────┬─────┬─────┐
     │     │     │ Level 2 DFD - Ticket Management Detail    │
 50  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
     │     │     │     │     │     │     │     │     │
 80  │Empl │     │ D1:Employee│     │     │SysAdmin   │
     │     │     │ Database   │     │     │     │     │
120  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
     │     │     │     │     │     │     │     │     │
150  │     │ 3.1 │     │ 3.2 │     │ 3.3 │     │     │
     │     │Create     │Valid│     │Route│     │     │
200  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
 220 │D4:  │     │     │ D2: Ticket Database │     │     │
     │Cat  │     │     │           │     │     │     │
250  │Rules│     │     │           │     │     │     │
280  ├─────┼─────┼─────┼─────┼─────┼─────┼D3:──┼─────┤
     │     │     │     │     │     │     │Atch │     │
300  │     │ 3.4 │     │     │ 3.5 │     │Stor │Tick │
     │     │Proc │     │     │Updt │     │     │Coord│
350  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
     │     │     │     │     │     │     │     │     │
380  │     │     │D5:Workflow│     │     │     │     │
     │     │     │Rules     │     │     │     │     │
420  ├─────┼─────┼─────┼─────┼─────┼─────┼─────┼─────┤
     │     │     │     │     │     │     │     │     │
450  │     │     │     │ 3.6 │     │     │     │     │
     │     │     │     │Close│     │     │     │     │
500  └─────┴─────┴─────┴─────┴─────┴─────┴─────┴─────┘
```

### **Level 2 Coordinate Specifications:**

#### **SUB-PROCESSES (Circles - 80px diameter):**
- **3.1 Create Ticket**: (150, 150)
- **3.2 Validate Ticket**: (350, 150)
- **3.3 Route Ticket**: (550, 150)
- **3.4 Process Ticket**: (200, 300)
- **3.5 Update Status**: (500, 300)
- **3.6 Close Ticket**: (350, 450)

#### **DATA STORES (Open Rectangles - 120px × 35px):**
- **D1 Employee Database**: (250, 80)
- **D2 Ticket Database**: (400, 220)
- **D3 Attachment Storage**: (600, 280)
- **D4 Category Rules**: (100, 200)
- **D5 Workflow Rules**: (300, 380)

#### **EXTERNAL ENTITIES (Rectangles - 100px × 50px):**
- **Employee**: (50, 120)
- **System Admin**: (600, 80)
- **Ticket Coordinator**: (650, 350)

### **Level 2 Flow Zones:**

#### **Creation Zone** (Top Layer - Y: 80-180):
- Employee input flows
- Initial ticket creation and validation
- Rule-based processing setup

#### **Processing Zone** (Middle Layer - Y: 200-350):
- Core ticket processing workflows
- Data store interactions
- Assignment and routing decisions

#### **Completion Zone** (Bottom Layer - Y: 380-500):
- Status updates and closure processes
- Final workflow execution
- Completion notifications

#### **5.5 Create Detailed Data Flows (Level 2)**
Map the complete ticket lifecycle with all sub-process connections:

#### **External Entity to Sub-Process Flows:**

**Employee Interactions:**
1. **Employee → 3.1**: "Ticket Request"
   - **Style**: Blue arrow, 2px width
2. **Employee → 3.1**: "Attachment Files"
   - **Style**: Blue arrow, 2px width
3. **3.5 → Employee**: "Status Notification"
   - **Style**: Green arrow, 2px width
4. **3.6 → Employee**: "Closure Confirmation"
   - **Style**: Green arrow, 2px width

**Ticket Coordinator Interactions:**
5. **Ticket Coordinator → 3.3**: "Routing Decisions"
   - **Style**: Blue arrow, 2px width
6. **Ticket Coordinator → 3.4**: "Processing Instructions"
   - **Style**: Blue arrow, 2px width
7. **3.3 → Ticket Coordinator**: "Assignment Notifications"
   - **Style**: Green arrow, 2px width
8. **3.4 → Ticket Coordinator**: "Processing Updates"
   - **Style**: Green arrow, 2px width

**System Admin Interactions:**
9. **System Admin → 3.2**: "Validation Rules"
   - **Style**: Blue arrow, 2px width
10. **3.5 → System Admin**: "Status Reports"
    - **Style**: Green arrow, 2px width

#### **Sub-Process to Data Store Flows:**

**Process 3.1 (Create Ticket) Data Store Interactions:**
1. **3.1 → D1**: "Employee Verification"
   - **Style**: Purple arrow, 1px width
2. **D1 → 3.1**: "Employee Details"
   - **Style**: Orange arrow, 1px width
3. **3.1 → D2**: "New Ticket Record"
   - **Style**: Purple arrow, 2px width
4. **3.1 → D3**: "Attachment Metadata"
   - **Style**: Purple arrow, 1px width

**Process 3.2 (Validate Ticket) Data Store Interactions:**
5. **3.2 → D4**: "Category Rules Query"
   - **Style**: Purple arrow, 1px width
6. **D4 → 3.2**: "Validation Rules"
   - **Style**: Orange arrow, 1px width
7. **3.2 → D2**: "Validation Status"
   - **Style**: Purple arrow, 2px width
8. **D2 → 3.2**: "Ticket Details"
   - **Style**: Orange arrow, 2px width

**Process 3.3 (Route Ticket) Data Store Interactions:**
9. **3.3 → D5**: "Workflow Rules Query"
   - **Style**: Purple arrow, 1px width
10. **D5 → 3.3**: "Routing Rules"
    - **Style**: Orange arrow, 1px width
11. **3.3 → D2**: "Assignment Update"
    - **Style**: Purple arrow, 2px width
12. **D2 → 3.3**: "Current Assignment"
    - **Style**: Orange arrow, 2px width

**Process 3.4 (Process Ticket) Data Store Interactions:**
13. **3.4 ↔ D2**: "Processing Updates" (bidirectional)
    - **Style**: Purple arrows, 2px width each direction
14. **3.4 → D3**: "Solution Attachments"
    - **Style**: Purple arrow, 1px width
15. **D3 → 3.4**: "Reference Files"
    - **Style**: Orange arrow, 1px width

**Process 3.5 (Update Status) Data Store Interactions:**
16. **3.5 ↔ D2**: "Status Changes" (bidirectional)
    - **Style**: Purple arrows, 2px width each direction
17. **3.5 → D1**: "User Notification Lookup"
    - **Style**: Purple arrow, 1px width
18. **D1 → 3.5**: "Contact Information"
    - **Style**: Orange arrow, 1px width

**Process 3.6 (Close Ticket) Data Store Interactions:**
19. **3.6 → D2**: "Closure Data"
    - **Style**: Purple arrow, 2px width
20. **D2 → 3.6**: "Final Ticket State"
    - **Style**: Orange arrow, 2px width
21. **3.6 → D3**: "Archive Request"
    - **Style**: Purple arrow, 1px width

#### **Inter-Sub-Process Flows (Sequential Workflow):**

**Creation to Validation Flow:**
1. **3.1 → 3.2**: "New Ticket"
   - **Style**: Blue arrow, 2px width
   - **Label Position**: Center of arrow
   - **Condition**: "Ticket created successfully"

**Validation to Routing Flow:**
2. **3.2 → 3.3**: "Valid Ticket"
   - **Style**: Blue arrow, 2px width
   - **Condition**: "Validation passed"
3. **3.2 → Employee**: "Validation Error"
   - **Style**: Red arrow, 2px width
   - **Condition**: "Validation failed"

**Routing to Processing Flow:**
4. **3.3 → 3.4**: "Assigned Ticket"
   - **Style**: Blue arrow, 2px width
   - **Condition**: "Routing completed"

**Processing to Status Update Flow:**
5. **3.4 → 3.5**: "Processing Complete"
   - **Style**: Blue arrow, 2px width
   - **Condition**: "Work finished"
6. **3.4 → 3.5**: "Progress Update"
   - **Style**: Blue arrow, 1px width
   - **Condition**: "Interim update"

**Status Update to Closure Flow:**
7. **3.5 → 3.6**: "Ready for Closure"
   - **Style**: Blue arrow, 2px width
   - **Condition**: "Status = Resolved"

**Feedback Loops:**
8. **3.4 → 3.3**: "Reassignment Request"
   - **Style**: Blue curved arrow, 1px width
   - **Condition**: "Requires different specialist"
9. **3.5 → 3.4**: "Reopen Request"
   - **Style**: Blue curved arrow, 1px width
   - **Condition**: "Additional work needed"
10. **3.6 → 3.5**: "Closure Rejected"
    - **Style**: Red curved arrow, 1px width
    - **Condition**: "Customer not satisfied"

#### **Error and Exception Flows:**

**Validation Failures:**
1. **3.2 → Employee**: "Missing Information"
   - **Style**: Red arrow, 2px width
2. **3.2 → Employee**: "Invalid Category"
   - **Style**: Red arrow, 2px width

**Processing Exceptions:**
3. **3.4 → Ticket Coordinator**: "Escalation Required"
   - **Style**: Red arrow, 2px width
4. **3.4 → System Admin**: "System Error"
   - **Style**: Red arrow, 2px width

**Data Quality Issues:**
5. **3.1 → Employee**: "Duplicate Ticket"
   - **Style**: Red arrow, 2px width
6. **3.3 → Ticket Coordinator**: "No Available Agent"
   - **Style**: Red arrow, 2px width

#### **Notification Flows:**

**Status Change Notifications:**
1. **3.5 → Process 5.0**: "Send Status Email"
   - **Style**: Purple arrow, 2px width
   - **External connection to Level 1 Process 5.0**
2. **3.3 → Process 5.0**: "Send Assignment Email"
   - **Style**: Purple arrow, 2px width
3. **3.6 → Process 5.0**: "Send Closure Email"
   - **Style**: Purple arrow, 2px width

#### **Reporting and Analytics Flows:**

**Metrics Collection:**
1. **3.1 → Process 7.0**: "Creation Metrics"
   - **Style**: Purple arrow, 1px width
2. **3.4 → Process 7.0**: "Processing Time"
   - **Style**: Purple arrow, 1px width
3. **3.6 → Process 7.0**: "Resolution Metrics"
   - **Style**: Purple arrow, 1px width

#### **Level 2 Data Flow Summary:**
- **Total Sub-Process Flows**: 45 arrows
- **External Entity Flows**: 10 arrows
- **Data Store Access Flows**: 21 arrows
- **Inter-Sub-Process Flows**: 10 arrows
- **Error/Exception Flows**: 6 arrows
- **Notification Flows**: 3 arrows
- **Reporting Flows**: 3 arrows

#### **Flow Categories:**
- **Main Workflow** (Blue): Sequential processing path
- **Data Access** (Purple/Orange): Database interactions
- **Notifications** (Purple to external): Status updates
- **Errors** (Red): Exception handling
- **Feedback** (Curved Blue): Process loops

### **Level 2 DFD Quality Checklist:**
- ✅ All sub-processes numbered as 3.1, 3.2, 3.3, etc.
- ✅ Sequential workflow clearly defined (3.1 → 3.2 → 3.3 → 3.4 → 3.5 → 3.6)
- ✅ Data store access patterns documented
- ✅ External entity interactions maintained from Level 1
- ✅ Exception and error flows included
- ✅ Cross-level integration flows specified
- ✅ Visual Paradigm sub-process standards followed

---

## DFD Styling and Standards

### **Step 6: Apply Visual Paradigm Styling**

#### **6.1 Shape Styling Guidelines**
| Component | Shape | Fill Color | Border | Font |
|-----------|-------|------------|--------|------|
| **External Entity** | Rectangle | Light Gray (#F5F5F5) | 2px solid black | Bold, 11pt |
| **Process** | Circle | Light Blue (#E3F2FD) | 2px solid blue | Bold, 10pt |
| **Data Store** | Open Rectangle | Light Yellow (#FFFDE7) | 2px solid (3 sides) | Bold, 10pt |
| **External Service** | Rectangle | Light Orange (#FFF3E0) | 2px solid orange | Bold, 11pt |

#### **6.2 Data Flow Arrow Styling**
- **Input Flows**: Blue arrows (#1976D2)
- **Output Flows**: Green arrows (#388E3C)
- **Bidirectional**: Purple arrows (#7B1FA2)
- **Error Flows**: Red arrows (#D32F2F)
- **Width**: 2px for main flows, 1px for secondary flows
- **Label Font**: Regular, 9pt with white background

#### **6.3 Layout Guidelines**
- **Process Spacing**: Minimum 120px between processes
- **Entity Positioning**: Around the perimeter of the diagram
- **Data Store Placement**: Between related processes
- **Flow Direction**: Left-to-right for main flows, top-to-bottom for hierarchical

### **Step 7: Add Documentation and Legends**

#### **7.1 Create DFD Legend**
Add a legend box in the bottom-right corner:
```
DFD Legend:
□ External Entity
○ Process
▭ Data Store
→ Data Flow

Process Numbering:
1.0 - Major Process
3.1 - Sub-process of 3.0
```

#### **7.2 Add Data Flow Labels Table**
Create a table showing all data flows:
| From | To | Data Flow | Description |
|------|----|-----------| ------------|
| Employee | 1.0 | Login Request | User authentication data |
| 1.0 | D1 | User Credentials | Query user database |
| ... | ... | ... | ... |

#### **7.3 Add Process Descriptions**
For each process, add a description box:
```
Process 3.1: Create Ticket
Input: Ticket Request from Employee
Processing: Validate user permissions, create ticket record
Output: New Ticket to Validation Process
```

### **Step 8: Quality Review and Export**

#### **8.1 DFD Quality Checklist**
- ✅ All processes are numbered consistently
- ✅ All data flows are labeled clearly
- ✅ No orphaned processes (all connected)
- ✅ Data stores have proper notation
- ✅ External entities are clearly identified
- ✅ No data flows between external entities
- ✅ Process names are verb phrases
- ✅ Data flow names are noun phrases

#### **8.2 Visual Standards Check**
- ✅ Consistent shape sizes and colors
- ✅ Clear, readable fonts
- ✅ Proper spacing and alignment
- ✅ Professional appearance
- ✅ Visual Paradigm standards followed

#### **8.3 Export Options**
1. **PNG Export**:
   - **File** → **Export as** → **PNG**
   - **DPI**: 300 for print quality
   - **Size**: A3 or larger
   - **Background**: White

2. **PDF Export**:
   - **File** → **Export as** → **PDF**
   - **Quality**: High
   - **Size**: A3 Landscape

3. **Multi-page PDF** (for all DFD levels):
   - Select all pages
   - Export as single PDF document

---

## DFD Best Practices

### **Data Flow Naming Conventions**
- Use **noun phrases** for data flows (e.g., "User Credentials", "Ticket Status")
- Use **verb phrases** for processes (e.g., "Validate User", "Create Ticket")
- Be **specific and descriptive** (avoid "data", "information")
- Keep names **concise** but clear

### **Process Decomposition Rules**
- **Level 0**: Single process representing entire system
- **Level 1**: 5-9 major processes (cognitive limit)
- **Level 2**: Detailed breakdown of complex processes
- **Numbering**: 1.0, 2.0, 3.0 for Level 1; 3.1, 3.2, 3.3 for Level 2

### **Data Store Guidelines**
- Use **plural nouns** (e.g., "Employees", "Tickets")
- Include **D notation** (D1, D2, D3)
- Show **access patterns** (read/write) in data flows
- **Position centrally** between accessing processes

---

## Conclusion

This guide provides comprehensive instructions for creating professional Data Flow Diagrams in Draw.io following Visual Paradigm standards:

### **Key Achievements:**
1. **Standards Compliance**: Follows Visual Paradigm DFD conventions
2. **Complete Hierarchy**: Level 0, 1, and 2 diagrams
3. **Professional Styling**: Consistent colors, fonts, and layouts
4. **Clear Documentation**: Legends, tables, and descriptions
5. **Quality Assurance**: Comprehensive checklists and reviews

### **Deliverables:**
- **Level 0**: Context diagram showing system boundary
- **Level 1**: Major processes and data stores
- **Level 2**: Detailed ticket management processes
- **Documentation**: Legends, flow tables, and process descriptions

The DFD set provides complete documentation of SmartSupport system data flows for stakeholders, developers, and system analysts.

---

**Document Version**: 1.0  
**Last Updated**: October 2025  
**Prepared By**: Data Architecture Team  
**Standards Compliance**: Visual Paradigm DFD Standards  
**Status**: Ready for Implementation