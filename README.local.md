# 🚀 Local Development Setup

This is a simplified Docker Compose setup for local development using SQLite.

## 📋 Prerequisites

- Docker Desktop (running)
- Git

## 🏃‍♂️ Quick Start

```powershell
# Clone and navigate to project
git clone https://github.com/seyxhel/Group5Capstone1.git
cd Group5Capstone1
git checkout hdts-dockerized-system

# Start the development stack
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
- **Frontend**: React + Vite served by nginx
- **RabbitMQ**: Message broker for background tasks

## 💡 Features

- ✅ **No PostgreSQL setup required** - uses SQLite automatically
- ✅ **Fast startup** - lightweight containers only
- ✅ **Debug mode enabled** - for development
- ✅ **Auto-created admin user** - ready to use
- ✅ **Hot reload friendly** - rebuild when code changes

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
