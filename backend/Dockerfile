FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the Django project
COPY . .

# Collect static files
RUN python manage.py collectstatic --noinput

# Automatically run makemigrations, then migrations, then start Gunicorn
CMD ["sh", "-c", "python manage.py makemigrations --noinput && python manage.py migrate && python manage.py createsuperuser --noinput --username=$DJANGO_SUPERUSER_USERNAME --email=$DJANGO_SUPERUSER_EMAIL --password=$DJANGO_SUPERUSER_PASSWORD --first_name=Admin --last_name=Admin --company_id=MA0001 || true && python manage.py collectstatic --noinput && gunicorn --bind 0.0.0.0:8000 backend.wsgi"]