from __future__ import absolute_import, unicode_literals
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

app = Celery('ticket_service')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()

# command to start the worker with the specific queue
# cd backend
# celery -A backend worker -Q ticket_status -l info