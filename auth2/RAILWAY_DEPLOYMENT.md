# Railway Deployment Guide - Auth Service

## 🚀 Quick Setup

### Step 1: Create Railway Project

1. Go to [Railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Connect your repository: `Gknightt/Ticket-Tracking-System`

### Step 2: Add PostgreSQL Database

1. In your Railway project, click "New"
2. Select "Database" → "Add PostgreSQL"
3. Railway will automatically:
   - Create a PostgreSQL database
   - Generate a `DATABASE_URL` environment variable
   - Link it to your service

**That's it!** Railway automatically provides `DATABASE_URL` - you don't need to manually configure it.

### Step 3: Configure Environment Variables

In Railway, go to your auth service → Variables → Add the following:

#### Required Variables

```bash
# Django Core
SECRET_KEY=your-super-secret-key-here-generate-new-one
DEBUG=False
ENVIRONMENT=production

# Allowed Hosts (Railway provides these automatically)
ALLOWED_HOSTS=your-app.up.railway.app,*.railway.app

# CORS (add your frontend domain)
CORS_ALLOWED_ORIGINS=https://your-frontend.railway.app,https://yourdomain.com
```

#### Optional Variables (Email, Notifications, etc.)

```bash
# Email Configuration (if using email features)
EMAIL_BACKEND=django.core.mail.backends.smtp.EmailBackend
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USE_TLS=True
EMAIL_HOST_USER=your-email@gmail.com
EMAIL_HOST_PASSWORD=your-app-password
DEFAULT_FROM_EMAIL=noreply@yourdomain.com

# Notification Service (if separate)
NOTIFICATION_SERVICE_URL=https://your-notification-service.railway.app
NOTIFICATIONS_ENABLED=True

# System URLs
TTS_SYSTEM_URL=https://your-frontend.railway.app/tts
DEFAULT_SYSTEM_URL=https://your-frontend.railway.app/dashboard
```

## 📝 How Railway PostgreSQL Works

### Automatic Configuration

When you add PostgreSQL in Railway:

1. **Railway creates these variables automatically:**
   - `DATABASE_URL` - Full connection string (postgres://user:pass@host:port/db)
   - `PGHOST` - Database host
   - `PGPORT` - Database port (usually 5432)
   - `PGUSER` - Database user
   - `PGPASSWORD` - Database password
   - `PGDATABASE` - Database name

2. **Your settings.py handles it automatically:**
   ```python
   if config('DATABASE_URL', default=''):
       DATABASES = {
           'default': dj_database_url.config(
               default=config('DATABASE_URL'),
               conn_max_age=600,
               conn_health_checks=True,
           )
       }
   ```

### No Manual Configuration Needed! 🎉

Railway automatically:
- Creates the database
- Generates credentials
- Sets the `DATABASE_URL` variable
- Links it to your service

## 🔧 Railway Service Configuration

### Root Directory

If your auth service is in a subfolder, set the root directory:

1. Go to your service → Settings
2. Set **Root Directory**: `auth`
3. Railway will use the Dockerfile in `/auth/Dockerfile`

### Build Configuration

Railway auto-detects your Dockerfile. No additional config needed!

Your `Dockerfile` is already configured correctly:
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
RUN python manage.py collectstatic --noinput
CMD ["/app/entrypoint.sh"]
```

### Health Checks (Optional but Recommended)

Railway can monitor your service health:

1. Add a health check endpoint in your Django app
2. Configure in Railway: Settings → Health Check Path: `/health/`

## 🎯 Deployment Workflow

### Initial Deployment

```bash
# 1. Push your code to GitHub
git add .
git commit -m "Prepare for Railway deployment"
git push origin main

# 2. Railway auto-deploys on push (if connected)
# Or manually trigger deployment in Railway dashboard
```

### Database Migrations

Your `entrypoint.sh` already runs migrations automatically:

```bash
#!/bin/bash
python manage.py migrate --noinput
python manage.py collectstatic --noinput
exec gunicorn auth.wsgi:application --bind 0.0.0.0:$PORT
```

**Railway runs this on every deployment!**

## 📊 Monitoring Your Database

### View Database Connection Info

In Railway:
1. Go to your PostgreSQL service
2. Click "Connect"
3. View connection details (host, port, user, password)

### Access Database Directly

```bash
# Railway provides a DATABASE_URL, use it with psql:
psql $DATABASE_URL

# Or in Railway dashboard:
# Click PostgreSQL service → "Query" tab
```

## 🔐 Security Checklist

- [ ] `DEBUG=False` in production
- [ ] Strong `SECRET_KEY` (generate new one, don't reuse from dev)
- [ ] `ALLOWED_HOSTS` set to your Railway domain
- [ ] `CORS_ALLOWED_ORIGINS` configured with frontend URL
- [ ] Database credentials never in code (Railway provides them)
- [ ] Email passwords use app-specific passwords
- [ ] `.env` file in `.gitignore` (never commit it!)

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Check if DATABASE_URL is set in Railway
# Go to service → Variables → Ensure DATABASE_URL exists

# If migrations fail, check logs:
# Railway Dashboard → Your Service → Deployments → View Logs
```

### Common Issues

1. **"Server Error (500)"**
   - Check `DEBUG=False` is set
   - Review deployment logs in Railway
   - Ensure all required env vars are set

2. **"No such table"**
   - Migrations didn't run
   - Check `entrypoint.sh` is executable
   - Review deployment logs

3. **"Connection refused"**
   - DATABASE_URL not set correctly
   - PostgreSQL service not linked
   - Check PostgreSQL service is running

### View Logs

```bash
# In Railway Dashboard:
# Your Service → Deployments → Click deployment → View Logs

# Look for:
# - Migration output
# - Gunicorn startup
# - Database connection messages
```

## 🎓 Railway Best Practices

1. **Use Railway's PostgreSQL** - Don't use external databases
2. **Environment Variables** - Store all secrets in Railway Variables
3. **Auto Deploys** - Enable automatic deployments from GitHub
4. **Multiple Environments** - Use separate Railway projects for staging/production
5. **Monitor Usage** - Check Railway dashboard for resource usage

## 📚 Next Steps

After deploying auth service:

1. **Test the API**: `https://your-auth.railway.app/api/v1/users/`
2. **Create superuser**: Use Railway CLI or add management command
3. **Deploy other services**: messaging, notification, ticket, workflow
4. **Update frontend**: Point to Railway auth URL
5. **Setup custom domain** (optional)

## 🔗 Useful Links

- [Railway Documentation](https://docs.railway.app/)
- [Railway PostgreSQL Docs](https://docs.railway.app/databases/postgresql)
- [Django Railway Guide](https://docs.railway.app/guides/django)

---

**Your auth service is now ready for Railway deployment! 🚀**

The key takeaway: **Just add PostgreSQL in Railway, and `DATABASE_URL` is automatically provided.**
