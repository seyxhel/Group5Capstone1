from django.core.management.base import BaseCommand
from systems.models import System
from users.models import User
from roles.models import Role
from system_roles.models import UserSystemRole

class Command(BaseCommand):
    help = 'Seed the database with initial systems, roles, and admin users.'

    def handle(self, *args, **kwargs):
        systems = [
            {'name': 'Help Desk and Ticketing System', 'slug': 'hdts'},
            {'name': 'Ticket Tracking System', 'slug': 'tts'},
            {'name': 'Asset Management System', 'slug': 'ams'},
            {'name': 'Budget Management System', 'slug': 'bms'},
        ]

        for system_data in systems:
            system, created = System.objects.get_or_create(name=system_data['name'], slug=system_data['slug'])
            if created:
                self.stdout.write(self.style.SUCCESS(f"Successfully created system: {system.name}"))
            else:
                self.stdout.write(self.style.WARNING(f"System already exists: {system.name}"))

            # Create or get the admin role for the system
            admin_role, role_created = Role.objects.get_or_create(
                system=system,
                name='Admin',
                defaults={
                    'description': f'Administrator role for {system.name}',
                    'is_custom': False
                }
            )

            if role_created:
                self.stdout.write(self.style.SUCCESS(f"Successfully created admin role for system: {system.name}"))

            # Create the admin user for the system
            admin_username = f"Admin{system.slug}"
            admin_email = f"admin{system.slug.lower()}@example.com"

            try:
                admin_user, user_created = User.objects.get_or_create(
                    email=admin_email,
                    defaults={
                        'username': admin_username,
                        'is_staff': True,
                        'first_name': 'Admin',
                        'last_name': system.name
                    }
                )
                
                if user_created:
                    admin_user.set_password('admin')
                    admin_user.save()
                    self.stdout.write(self.style.SUCCESS(f"Successfully created admin user for system: {system.name}"))
                
                # Assign admin role to the user - simplified with integer IDs
                try:
                    user_system_role, usr_created = UserSystemRole.objects.get_or_create(
                        user=admin_user,
                        system=system,
                        role=admin_role
                    )
                    
                    if usr_created:
                        self.stdout.write(self.style.SUCCESS(f"Successfully assigned admin role to user for system: {system.name}"))
                    else:
                        self.stdout.write(self.style.WARNING(f"Role assignment already exists for system: {system.name}"))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f"Error creating UserSystemRole: {str(e)}"))
                    # Print more debug information
                    self.stdout.write(self.style.WARNING(f"Available fields in UserSystemRole: {[f.name for f in UserSystemRole._meta.get_fields()]}"))
                
            except Exception as e:
                self.stdout.write(self.style.ERROR(f"Error creating admin user for system {system.name}: {str(e)}"))