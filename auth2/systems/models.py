from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils.timezone import now

# Create your models here.
class System(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=255, unique=True)
    slug = models.SlugField(max_length=255, unique=True)
    created_at = models.DateTimeField(default=now)

    def __str__(self):
        return self.name


@receiver(post_save, sender=System)
def create_system_admin(sender, instance, created, **kwargs):
    """
    Automatically create an admin user when a new system is created.
    Creates a user with:
    - username: Admin{slug}
    - email: admin{slug.lower()}@example.com  
    - password: admin
    - assigned to admin role in the system
    """
    if created:
        from users.models import User
        from roles.models import Role
        from system_roles.models import UserSystemRole
        
        # Create admin username and email based on system slug
        admin_username = f"Admin{instance.slug}"
        admin_email = f"admin{instance.slug.lower()}@example.com"
        
        # Create the admin user
        try:
            admin_user = User.objects.create_user(
                email=admin_email,
                username=admin_username,
                password="admin",
                first_name="Admin",
                last_name=instance.name,
                is_staff=True  # Make them staff so they can access admin interface
            )
            
            # Create or get an admin role for this system
            admin_role, role_created = Role.objects.get_or_create(
                system=instance,
                name="Admin",
                defaults={
                    'description': f'Administrator role for {instance.name}',
                    'is_custom': False
                }
            )
            
            # Assign the admin role to the user for this system
            UserSystemRole.objects.create(
                user=admin_user,
                system=instance,
                role=admin_role
            )
            
        except Exception as e:
            # Log error but don't prevent system creation
            print(f"Error creating admin user for system {instance.slug}: {e}")
