The SmartSupport Help Desk System is built using Django REST Framework and includes:
- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **User Management**: Employee registration, approval workflow, and profile management  
- **Ticket Management**: Complete ticket lifecycle from creation to resolution
- **Department Management**: Department-based ticket routing and assignment
- **Email Integration**: Gmail API integration for notifications
- **Secure Media Handling**: Token-based file access and secure serving

---

## Requirements to Access

### System Requirements
**Operating System**: Windows 10/11, macOS 10.14+, or Linux (Ubuntu 18.04+)  
**RAM**: Minimum 8GB (16GB recommended for development)  
**Storage**: At least 5GB free space  
**Network**: Stable internet connection for package downloads

### Software Prerequisites

#### Core Development Tools
**Python 3.8+**
- Download from python.org
- Ensure pip is included in installation
- Verify installation: `python --version`

**Node.js 16+ and npm**
- Download from nodejs.org
- Verify installation: `node --version` and `npm --version`

**Git**
- Download from git-scm.com
- Configure with your credentials

#### Database
**PostgreSQL 16+**
- Download from postgresql.org
- Remember your database credentials
- Create a database with your desired database name

#### Optional Tools
**Docker & Docker Compose** (for containerized development)
- Download Docker Desktop from docker.com

**Code Editor**
- Visual Studio Code

### Environment Variables
Create the following environment by copying the provided examples:
- Copy `.env.example` in the project directory (for backend).
- Copy `.env.example` in the frontendfolder directory (for frontend).

### API Keys and Services
**Gmail API Credentials** (for email functionality)
- Google Cloud Console project
- Gmail API enabled
- OAuth 2.0 credentials

**Railway Account** (for deployment)
- Account at railway.app

## Set Up Instructions

### 1. Clone the Repository
```
git clone https://github.com/seyxhel/Group5Capstone1.git
cd Group5Capstone1
```

### 2. Backend Setup

#### 2.1 Navigate to Backend Directory
```
cd backend
```

#### 2.2 Create Virtual Environment
```
# Windows
python -m venv env
env\Scripts\activate

# macOS/Linux
python3 -m venv env
source env/bin/activate
```

#### 2.3 Install Dependencies
```
pip install -r requirements.txt
```

#### 2.4 Environment Configuration
Use the .env file created in the project directory, and ask the backend developer which variables to include, since some of them are sensitive

#### 2.5 Database Setup
```
# Run migrations
python manage.py makemigrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser
```

#### 2.6 Start Backend Server
```
python manage.py runserver
```

The backend will be available at http://localhost:8000

### 3. Frontend Setup

#### 3.1 Navigate to Frontend Directory
Open another terminal
```
cd frontendfolder
```

#### 3.2 Install Dependencies
```
npm install
```

#### 3.3 Environment Configuration
Use the .env file created in the frontendfolder directory, and ask the backend developer which variables to include, since some of them are sensitive

#### 3.4 Start Frontend Development Server
```
npm run dev
```

The frontend will be available at http://localhost:5173

### 4. Docker Setup (Alternative)
If you prefer using Docker:
```
# Build and run with Docker Compose
docker-compose up --build

# Run in detached mode
docker-compose up -d
```

### 5. Celery Setup (for Integration)

#### 5.1 Start Celery Worker
```
# In the backend directory
cd backend
celery -A backend worker --loglevel=info
```

## Development Guide

### Project Architecture
**SmartSupport Help Desk System**  
└ Backend (Django REST Framework)  
   ├─ Authentication & Authorization  
   ├─ User Management  
   ├─ Ticket Management  
   ├─ Department Management  
   ├─ Email Integration  
   └─ Secure Media Handling

### 1. Code Structure
```
backend/
├── backend/                 # Django project settings
│   ├── settings.py         # Main configuration
│   ├── urls.py             # URL routing
│   └── celery.py           # Celery configuration
├── core/                   # Main application
│   ├── models.py           # Database models
│   ├── views.py            # API views
│   ├── serializers.py      # Data serialization
│   ├── urls.py             # App-specific URLs
│   ├── admin.py            # Admin interface
│   ├── tasks.py            # Celery tasks
│   └── utils/              # Utility functions
└── media/                  # File uploads
```

### 2. Authentication & Authorization
- JWT tokens for authentication
- Role-based permissions (Employee, Ticket Coordinator, Admin)

### Security Best Practices

#### Backend Security
**Authentication**
- JWT tokens with expiration
- Secure password hashing
- Rate limiting on auth endpoints

**Authorization**
- Role-based access control
- Permission decorators on views
- Data filtering by user permissions

**Data Protection**
- Input validation and sanitization
- SQL injection prevention
- CORS configuration

### Git Workflow

#### Branch Naming
- frontend
- backend
- main
- release

#### Commit Messages
- Clear, descriptive messages

#### Pull Request Process
- Create feature branches from main
- Submit PR with detailed description
- Code review required before merge
- Squash commits when merging

### Deployment

#### Railway Deployment
- Connect GitHub repository
- Configure environment variables
- Set up PostgreSQL service
- Deploy with automatic builds

### Troubleshooting Common Issues

#### Backend Issues
**Database Connection Errors**
- Verify database credentials

**Import Errors**
- Install missing dependencies

if not, make an .md file for that content and change what's need to change or update