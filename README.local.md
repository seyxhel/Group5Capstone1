# 🚀 Local Development Setup

This is a **fully dockerized** setup for local development. **No manual installations required!**

## 📋 Prerequisites

- Docker Desktop (running)
- Git

## 🏃‍♂️ Quick Start

```powershell
# Clone and navigate to project
git clone https://github.com/seyxhel/Group5Capstone1.git
cd Group5Capstone1
git checkout hdts-dockerized-system

# Start the development stack (everything will be built automatically)
docker compose up --build -d
```

## 🌐 Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin
  - Username: `admin`
  - Password: `password`
- **RabbitMQ Management**: http://localhost:15672
  - Username: `guest`
  - Password: `guest`

## 🛠️ Development Commands

```powershell
# Start services
docker compose start

# Stop services  
docker compose stop

# Restart services
docker compose restart

# View logs
docker compose logs
docker compose logs backend
docker compose logs frontend

# Rebuild after code changes
docker compose up --build -d

# Complete shutdown
docker compose down
```

## 📊 Services

- **Backend**: Django + SQLite (no external database needed)
- **Frontend**: React + Vite with hot reload
- **RabbitMQ**: Message broker for background tasks

## 💡 Features

- ✅ **No manual setup required** - no npm install, no virtual environments, no requirements.txt installation
- ✅ **No PostgreSQL setup required** - uses SQLite automatically
- ✅ **Fast startup** - lightweight containers only
- ✅ **Debug mode enabled** - for development
- ✅ **Auto-created admin user** - ready to use
- ✅ **Hot reload enabled** - code changes reflect immediately
- ✅ **100% local backend** - no external dependencies on Railway or cloud services

## ❌ What You DON'T Need To Do

**Users do NOT need to:**
- ❌ Create Python virtual environments (`python -m venv env`)
- ❌ Install Python requirements (`pip install -r requirements.txt`)
- ❌ Install Node.js dependencies (`npm install`)
- ❌ Run frontend development server (`npm run dev`)
- ❌ Set up PostgreSQL database
- ❌ Create `.env` files manually
- ❌ Install Python, Node.js, or any programming language locally
- ❌ Run Django migrations manually
- ❌ Create Django superuser manually

**Everything is handled automatically by Docker containers!**

## 🔒 Local-Only Assurance

The frontend is configured to connect **ONLY** to your local Docker backend:
- API calls go to: `http://localhost:8000/api/`
- Media files from: `http://localhost:8000/media/`
- No external Railway or cloud dependencies

## 🔧 Troubleshooting

### Can't access admin panel?
- Make sure containers are running: `docker ps`
- Check backend logs: `docker compose logs backend`
- Try rebuilding: `docker compose up --build -d`

### Frontend not loading?
- Check if port 5173 is available
- Check frontend logs: `docker compose logs frontend`

### Need to add Docker to PATH?
```powershell
$env:PATH += ";C:\Program Files\Docker\Docker\resources\bin"
```
