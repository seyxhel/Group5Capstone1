# SmartSupport System - Component Architecture Diagram

## Visual Component Diagram (ASCII Art)

```
╔═══════════════════════════════════════════════════════════════════════════════════════════╗
║                                    SMARTSUPPORT SYSTEM                                    ║
║                              Component Architecture Diagram                               ║
╠═══════════════════════════════════════════════════════════════════════════════════════════╣
║                                                                                           ║
║  ┌─────────────────────────────────── FRONTEND LAYER ────────────────────────────────┐   ║
║  │                                                                                   │   ║
║  │   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐          │   ║
║  │   │   React SPA      │◯   │   Auth UI        │◯   │   Admin UI       │◯         │   ║
║  │   │                  │    │                  │    │                  │          │   ║
║  │   │ ◯ UI.Render()    │    │ ◯ Login()        │    │ ◯ UserMgmt()     │          │   ║
║  │   │ ◯ UI.Navigate()  │    │ ◯ Register()     │    │ ◯ TicketMgmt()   │          │   ║
║  │   │                  │    │                  │    │ ◯ Reports()      │          │   ║
║  │   │ ╰ Auth.login()   │    │ ╰ API.auth()     │    │ ╰ API.admin()    │          │   ║
║  │   │ ╰ TicketAPI.*    │    │ ╰ Validation.*   │    │ ╰ Analytics.*    │          │   ║
║  │   │ ╰ ChatAPI.*      │    │                  │    │                  │          │   ║
║  │   └──────────────────┘    └──────────────────┘    └──────────────────┘          │   ║
║  │                                                                                   │   ║
║  │   ┌──────────────────┐    ┌──────────────────┐                                  │   ║
║  │   │   Ticket UI      │◯   │   Chat Widget    │◯                                 │   ║
║  │   │                  │    │                  │                                  │   ║
║  │   │ ◯ Create()       │    │ ◯ ChatSend()     │                                  │   ║
║  │   │ ◯ Update()       │    │ ◯ HistoryLoad()  │                                  │   ║
║  │   │ ◯ Track()        │    │                  │                                  │   ║
║  │   │                  │    │ ╰ AI.complete()  │                                  │   ║
║  │   │ ╰ API.tickets()  │    │ ╰ Storage.*      │                                  │   ║
║  │   │ ╰ File.upload()  │    │                  │                                  │   ║
║  │   └──────────────────┘    └──────────────────┘                                  │   ║
║  └─────────────────────────────────────────────────────────────────────────────────┘   ║
║                                         │                                               ║
║                                         ▼                                               ║
║  ┌─────────────────────────────────── API GATEWAY ─────────────────────────────────┐   ║
║  │                                                                                   │   ║
║  │   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐          │   ║
║  │   │  Django REST API │◯   │  JWT Middleware  │◯   │  CORS Handler    │◯         │   ║
║  │   │                  │    │                  │    │                  │          │   ║
║  │   │ ◯ /api/auth/*    │    │ ◯ TokenValid()   │    │ ◯ CORSAllow()    │          │   ║
║  │   │ ◯ /api/tickets/* │    │ ◯ TokenRefresh() │    │ ◯ PreflightOK()  │          │   ║
║  │   │ ◯ /api/users/*   │    │                  │    │                  │          │   ║
║  │   │ ◯ /api/files/*   │    │ ╰ AuthSvc.*      │    │ ╰ Request.*      │          │   ║
║  │   │                  │    │                  │    │                  │          │   ║
║  │   │ ╰ Services.*     │    │                  │    │                  │          │   ║
║  │   └──────────────────┘    └──────────────────┘    └──────────────────┘          │   ║
║  └─────────────────────────────────────────────────────────────────────────────────┘   ║
║                                         │                                               ║
║                                         ▼                                               ║
║  ┌───────────────────────────────── BUSINESS LOGIC ────────────────────────────────┐   ║
║  │                                                                                   │   ║
║  │   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐          │   ║
║  │   │  Auth Service    │◯   │  User Service    │◯   │ Ticket Service   │◯         │   ║
║  │   │                  │    │                  │    │                  │          │   ║
║  │   │ ◯ Token.issue()  │    │ ◯ User.create()  │    │ ◯ Ticket.create()│          │   ║
║  │   │ ◯ Token.refresh()│    │ ◯ User.read()    │    │ ◯ Ticket.update()│          │   ║
║  │   │ ◯ Token.validate │    │ ◯ User.update()  │    │ ◯ Ticket.query() │          │   ║
║  │   │ ◯ User.auth()    │    │ ◯ User.approve() │    │ ◯ Ticket.assign()│          │   ║
║  │   │                  │    │                  │    │                  │          │   ║
║  │   │ ╰ DB.userStore   │    │ ╰ DB.userStore   │    │ ╰ DB.ticketStore │          │   ║
║  │   │                  │    │ ╰ EmailSvc.send()│    │ ╰ FileSvc.store()│          │   ║
║  │   │                  │    │                  │    │ ╰ EmailSvc.queue │          │   ║
║  │   └──────────────────┘    └──────────────────┘    └──────────────────┘          │   ║
║  │                                                                                   │   ║
║  │   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐          │   ║
║  │   │  File Service    │◯   │  Email Service   │◯   │ Chat/AI Service  │◯         │   ║
║  │   │                  │    │                  │    │                  │          │   ║
║  │   │ ◯ File.upload()  │    │ ◯ Email.send()   │    │ ◯ Chat.complete()│          │   ║
║  │   │ ◯ File.download()│    │ ◯ Email.queue()  │    │ ◯ Chat.summarize │          │   ║
║  │   │ ◯ File.secure()  │    │ ◯ Template.rend()│    │ ◯ FAQ.search()   │          │   ║
║  │   │ ◯ Image.resize() │    │                  │    │                  │          │   ║
║  │   │                  │    │ ╰ Gmail.API      │    │ ╰ OpenRouter.API │          │   ║
║  │   │ ╰ FileStore      │    │ ╰ Celery.queue   │    │ ╰ DB.chatLogs    │          │   ║
║  │   │ ╰ AuthSvc.token  │    │                  │    │                  │          │   ║
║  │   └──────────────────┘    └──────────────────┘    └──────────────────┘          │   ║
║  └─────────────────────────────────────────────────────────────────────────────────┘   ║
║                                         │                                               ║
║                                         ▼                                               ║
║  ┌────────────────────────────────── DATA LAYER ───────────────────────────────────┐   ║
║  │                                                                                   │   ║
║  │   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐          │   ║
║  │   │   PostgreSQL     │◯   │   File Storage   │◯   │   Redis Cache    │◯         │   ║
║  │   │                  │    │                  │    │                  │          │   ║
║  │   │ ◯ CRUD.users     │    │ ◯ Store.files    │    │ ◯ Cache.session  │          │   ║
║  │   │ ◯ CRUD.tickets   │    │ ◯ Serve.secure   │    │ ◯ Cache.tokens   │          │   ║
║  │   │ ◯ CRUD.comments  │    │ ◯ CDN.deliver    │    │ ◯ Queue.jobs     │          │   ║
║  │   │ ◯ Query.reports  │    │                  │    │                  │          │   ║
║  │   │                  │    │ ╰ Railway.volume │    │                  │          │   ║
║  │   │                  │    │                  │    │                  │          │   ║
║  │   └──────────────────┘    └──────────────────┘    └──────────────────┘          │   ║
║  └─────────────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                           ║
║  ┌─────────────────────────────── EXTERNAL SERVICES ───────────────────────────────┐   ║
║  │                                                                                   │   ║
║  │   ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐          │   ║
║  │   │    Gmail API     │◯   │  OpenRouter AI   │◯   │ Railway Platform │◯         │   ║
║  │   │                  │    │                  │    │                  │          │   ║
║  │   │ ◯ Send.email     │    │ ◯ LLM.complete   │    │ ◯ Deploy.app     │          │   ║
║  │   │ ◯ OAuth.auth     │    │ ◯ Models.access  │    │ ◯ Storage.volume │          │   ║
║  │   │                  │    │                  │    │ ◯ Database.host  │          │   ║
║  │   │                  │    │                  │    │                  │          │   ║
║  │   └──────────────────┘    └──────────────────┘    └──────────────────┘          │   ║
║  └─────────────────────────────────────────────────────────────────────────────────┘   ║
║                                                                                           ║
║  ┌─────────────────────────────── BACKGROUND WORKERS ──────────────────────────────┐   ║
║  │                                                                                   │   ║
║  │   ┌──────────────────┐    ┌──────────────────┐                                  │   ║
║  │   │  Celery Workers  │◯   │ Task Scheduler   │◯                                 │   ║
║  │   │                  │    │                  │                                  │   ║
║  │   │ ◯ Task.execute() │    │ ◯ Job.schedule() │                                  │   ║
║  │   │ ◯ Email.process()│    │ ◯ Cron.trigger() │                                  │   ║
║  │   │ ◯ File.process() │    │                  │                                  │   ║
║  │   │                  │    │                  │                                  │   ║
║  │   │ ╰ Redis.broker   │    │ ╰ Celery.beat    │                                  │   ║
║  │   │ ╰ DB.results     │    │                  │                                  │   ║
║  │   └──────────────────┘    └──────────────────┘                                  │   ║
║  └─────────────────────────────────────────────────────────────────────────────────┘   ║
╚═══════════════════════════════════════════════════════════════════════════════════════════╝
```

## Legend & Notation

```
┌──────────────────────────────────────────────────────────────┐
│                           LEGEND                             │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌─────────────────┐  = Component (Service/Module)          │
│  │   Component     │                                        │
│  └─────────────────┘                                        │
│                                                              │
│  ◯ Interface.name() = Provided Interface (what it offers)   │
│                                                              │
│  ╰ Service.method() = Required Interface (what it needs)    │
│                                                              │
│           │         = Dependency/Data Flow                  │
│           ▼                                                  │
│                                                              │
│  [Layer Name]       = Architectural Layer Grouping         │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

## Connection Flow Diagram

```
┌─────────────┐    REST API     ┌─────────────┐    Service     ┌─────────────┐
│  Frontend   │ ──────────────▶ │ API Gateway │ ─────────────▶ │  Business   │
│   Layer     │                 │             │                │   Logic     │
└─────────────┘                 └─────────────┘                └─────────────┘
                                                                       │
                                                                       ▼
┌─────────────┐    Background   ┌─────────────┐   Persistence  ┌─────────────┐
│ Background  │ ◀────────────── │ Data Layer  │ ◀───────────── │  Services   │
│  Workers    │                 │             │                │             │
└─────────────┘                 └─────────────┘                └─────────────┘
       │                               │
       ▼                               ▼
┌─────────────┐                ┌─────────────┐
│  External   │                │  External   │
│  Email API  │                │   Storage   │
└─────────────┘                └─────────────┘
```

## Key Interface Definitions

### Authentication Service
```
Provides: ◯ Token.issue(), ◯ Token.refresh(), ◯ Token.validate(), ◯ User.auth()
Requires: ╰ DB.userStore
```

### Ticket Service  
```
Provides: ◯ Ticket.create(), ◯ Ticket.update(), ◯ Ticket.query(), ◯ Ticket.assign()
Requires: ╰ DB.ticketStore, ╰ FileSvc.store(), ╰ EmailSvc.queue()
```

### File Service
```
Provides: ◯ File.upload(), ◯ File.download(), ◯ File.secure(), ◯ Image.resize()
Requires: ╰ FileStore, ╰ AuthSvc.token()
```

### Email Service
```
Provides: ◯ Email.send(), ◯ Email.queue(), ◯ Template.render()
Requires: ╰ Gmail.API, ╰ Celery.queue
```

### Chat/AI Service
```
Provides: ◯ Chat.complete(), ◯ Chat.summarize(), ◯ FAQ.search()
Requires: ╰ OpenRouter.API, ╰ DB.chatLogs
```

---

**Title**: SmartSupport System - Visual Component Architecture  
**Standard**: Visual Paradigm UML Component Diagram  
**Created**: October 2025  
**Format**: ASCII Art Visualization