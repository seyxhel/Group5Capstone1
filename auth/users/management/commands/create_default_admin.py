from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Create a default admin user.'

    def handle(self, *args, **kwargs):
        User = get_user_model()
        admin_email = 'admin@example.com'
        admin_password = 'adminpassword'

        if not User.objects.filter(email=admin_email).exists():
            User.objects.create_superuser(
                email=admin_email,
                password=admin_password,
                first_name='Admin',
                last_name='User',
                failed_login_attempts=0,  # Default value for required field
                is_locked=False  # Default value for required field
            )
            self.stdout.write(self.style.SUCCESS('Default admin user created.'))
        else:
            self.stdout.write(self.style.WARNING('Default admin user already exists.'))