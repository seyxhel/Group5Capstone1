import re
import random
from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.core.exceptions import ValidationError
from django.conf import settings
from django.utils import timezone
from django.db.models.signals import post_save
from django.dispatch import receiver

SUFFIX_CHOICES = [
    ('Jr.', 'Jr.'), ('Sr.', 'Sr.'), ('III', 'III'), ('IV', 'IV'), ('V', 'V'),
    ('VI', 'VI'), ('VII', 'VII'), ('VIII', 'VIII'), ('IX', 'IX'), ('X', 'X'),
]

DEPARTMENT_CHOICES = [
    ('IT Department', 'IT Department'),
    ('Asset Department', 'Asset Department'),
    ('Budget Department', 'Budget Department'),
]

ROLE_CHOICES = [
    ('Employee', 'Employee'),
    ('Ticket Coordinator', 'Ticket Coordinator'),
    ('System Admin', 'System Admin'),
]

STATUS_CHOICES = [
    ('Pending', 'Pending'),
    ('Approved', 'Approved'),
    ('Rejected', 'Rejected'),
]

class EmployeeManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError("Email is required")
        email = self.normalize_email(email)
        extra_fields.setdefault('is_staff', False)
        extra_fields.setdefault('is_superuser', False)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault("notified", True)
        return self.create_user(email, password, **extra_fields)

class Employee(AbstractBaseUser, PermissionsMixin):
    last_name = models.CharField(max_length=100)
    first_name = models.CharField(max_length=100)
    middle_name = models.CharField(max_length=100, blank=True, null=True)
    suffix = models.CharField(max_length=10, blank=True, null=True, choices=SUFFIX_CHOICES)
    company_id = models.CharField(max_length=6, unique=True)
    department = models.CharField(max_length=100, choices=DEPARTMENT_CHOICES)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)
    image = models.ImageField(upload_to='employee_images/', default='employee_images/default-profile.png', blank=True, null=True)

    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='Employee')
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='Pending')
    notified = models.BooleanField(default=False)

    is_staff = models.BooleanField(default=False)
    is_superuser = models.BooleanField(default=False)

    date_created = models.DateTimeField(auto_now_add=True)  # <-- Add this line

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['last_name', 'first_name', 'company_id']

    objects = EmployeeManager()

    last_login = None  # Optional: Only include if you do not want login tracking

    def clean(self):
        if not re.match(r'^MA\d{4}$', self.company_id):
            raise ValidationError("Company ID must be in the format MA0001 to MA9999")
        super().clean()

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

PRIORITY_LEVELS = [
    ('Critical', 'Critical'),
    ('High', 'High'),
    ('Medium', 'Medium'),
    ('Low', 'Low'),
]

STATUS_CHOICES = [
    ('New', 'New'),
    ('Open', 'Open'),
    ('In Progress', 'In Progress'),
    ('On Hold', 'On Hold'),
    ('Pending', 'Pending'),
    ('Resolved', 'Resolved'),
    ('Rejected', 'Rejected'),
    ('Closed', 'Closed'),
    ('Withdrawn','Withdrawn'),
]

CATEGORY_CHOICES = [
    ('Software', 'Software'),
    ('Hardware', 'Hardware'),
    ('Network', 'Network'),
    # Add more as needed
]

SUBCATEGORY_CHOICES = [
    ('Unauthorized App', 'Unauthorized App'),
    ('Application Error', 'Application Error'),
    # Add more as needed
]
def generate_unique_ticket_number():
        from .models import Ticket  # or avoid this if it's in the same file
        while True:
            random_number = f"TX{random.randint(1, 9999):04d}"
            if not Ticket.objects.filter(ticket_number=random_number).exists():
                return random_number
            
class Ticket(models.Model):
    ticket_number = models.CharField(max_length=6, unique=True, blank=True, null=True)
            
    def save(self, *args, **kwargs):
        if not self.ticket_number:
            self.ticket_number = generate_unique_ticket_number()
        super().save(*args, **kwargs)

    employee = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="tickets")
    subject = models.CharField(max_length=255)
    category = models.CharField(max_length=100)
    sub_category = models.CharField(max_length=100)
    description = models.TextField()
    scheduled_date = models.DateField(null=True, blank=True)
    priority = models.CharField(max_length=20, choices=PRIORITY_LEVELS, blank=True, null=True)
    department = models.CharField(max_length=50, choices=DEPARTMENT_CHOICES, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='New')
    submit_date = models.DateTimeField(auto_now_add=True)
    update_date = models.DateTimeField(auto_now=True)
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets')
    response_time = models.DurationField(blank=True, null=True)
    resolution_time = models.DurationField(blank=True, null=True)
    time_closed = models.DateTimeField(blank=True, null=True)
    rejection_reason = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Ticket #{self.id} - {self.subject}"

from .tasks import push_ticket_to_workflow

@receiver(post_save, sender=Ticket)
def send_ticket_to_workflow(sender, instance, created, **kwargs):
    # Only trigger when status is set to "Open" (and not just created)
    if not created and instance.status == "Open":
        from .tasks import push_ticket_to_workflow  # Import here!
        from .serializers import TicketSerializer   # Import here!
        data = TicketSerializer(instance).data
        push_ticket_to_workflow.delay(data)
        
class TicketAttachment(models.Model):
    ticket = models.ForeignKey('Ticket', on_delete=models.CASCADE, related_name='attachments')
    file = models.FileField(upload_to='ticket_attachments/')
    file_name = models.CharField(max_length=255)
    file_type = models.CharField(max_length=100)
    file_size = models.IntegerField()  # Size in bytes
    upload_date = models.DateTimeField(auto_now_add=True)
    uploaded_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True)
    
    def __str__(self):
        return f"{self.file_name} - {self.ticket.id}"

class TicketComment(models.Model):
    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE, related_name='comments')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    comment = models.TextField()
    is_internal = models.BooleanField(default=False)  # For admin-only comments
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"Comment on {self.ticket.ticket_number} by {self.user}"

class RejectedEmployeeAudit(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField()
    company_id = models.CharField(max_length=100)
    department = models.CharField(max_length=100)
    rejected_at = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(blank=True, null=True)
    rejected_by = models.CharField(max_length=200, blank=True, null=True)  # <-- Add this line