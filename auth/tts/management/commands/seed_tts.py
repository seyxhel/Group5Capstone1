from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from roles.models import Role
from systems.models import System
from system_roles.models import UserSystemRole
from urllib.parse import quote_plus, urlparse
import urllib.request
import mimetypes
import uuid
import os
from django.core.files.base import ContentFile

User = get_user_model()

class Command(BaseCommand):
    help = 'Seed database with predefined roles and users for the TTS system.'

    def handle(self, *args, **options):
        self.stdout.write('Seeding roles and users for the TTS system...')
        self.create_roles()
        self.create_users()
        self.stdout.write(self.style.SUCCESS('Done seeding roles and users for the TTS system.'))

    def create_roles(self):
        """Create roles specific to the TTS system."""
        self.roles = {}
        roles_data = [
            {'name': 'Admin', 'description': 'System administrator with full access'},
            {'name': 'Asset Manager', 'description': 'Manages digital assets and metadata'},
            {'name': 'Budget Manager', 'description': 'Oversees budget allocation and approvals'},
        ]

        try:
            self.tts_system = System.objects.get(slug='tts')
            for role_data in roles_data:
                role, created = Role.objects.get_or_create(
                    system=self.tts_system,
                    name=role_data['name'],
                    defaults={
                        'description': role_data['description']
                    }
                )
                self.roles[role.name] = role
                if created:
                    self.stdout.write(f'Created role: {role.name}')
                else:
                    self.stdout.write(f'Role already exists: {role.name}')
        except System.DoesNotExist:
            self.stdout.write(self.style.ERROR('TTS system does not exist. Please create the system first.'))
            self.tts_system = None

    def download_and_set_profile_picture(self, user, url):
        """Download image from url and save to user's profile_picture ImageField."""
        if not url or not url.lower().startswith('http'):
            return False
        try:
            with urllib.request.urlopen(url, timeout=15) as response:
                if getattr(response, 'status', None) and response.status != 200:
                    return False
                data = response.read()
                content_type = response.headers.get('Content-Type') if hasattr(response, 'headers') else None

            # Determine file extension
            ext = None
            if content_type:
                ext = mimetypes.guess_extension(content_type.split(';')[0].strip())
            if not ext:
                parsed = urlparse(url)
                ext = os.path.splitext(parsed.path)[1]
            if not ext:
                ext = '.jpg'

            filename = f"profile_{user.id or uuid.uuid4().hex}{ext}"

            # Save using Django storage (MEDIA)
            user.profile_picture.save(filename, ContentFile(data), save=True)
            self.stdout.write(f'Saved profile picture for {user.email} to {user.profile_picture.name}')
            return True
        except Exception as e:
            self.stdout.write(self.style.WARNING(f'Failed to download/save profile picture for {user.email}: {e}'))
            return False

    def create_users(self):
        """Create predefined users for the TTS system."""
        if not self.tts_system:
            return

        predefined_users = [
            {
                'first_name': 'danny',
                'last_name': 'welsh',
                'email': 'burnthisway22@gmail.com',
                'username': 'dandywelsh',
                'phone_number': '+10000000002',
                'role': 'Admin',
                'is_staff': True,
                'profile_picture': 'https://i.pinimg.com/736x/2b/1b/35/2b1b356a0326c833312843974dd18cf2.jpg',
            },
            {
                'first_name': 'John',
                'last_name': 'Doe',
                'email': 'burnthisway22+1@gmail.com',
                'username': 'admin1',  # Updated username to avoid conflict
                'phone_number': '+10000000011',  # Updated phone number to ensure uniqueness
                'role': 'Admin',
                'is_staff': True,
                'profile_picture': 'https://i.pinimg.com/1200x/fd/22/73/fd2273088744be03ceecba094eb1e307.jpg',
            },
            {
                'first_name': 'Jane',
                'last_name': 'Smith',
                'email': 'burnthisway22+2@gmail.com',
                'username': 'assetmanager',
                'phone_number': '+10000000012',  # Updated phone number to ensure uniqueness
                'role': 'Asset Manager',
                'is_staff': False,
                'profile_picture': 'https://i.pinimg.com/736x/38/02/93/380293b92bd3e90337c39e74ae18637c.jpg',
            },
            {
                'first_name': 'Bob',
                'last_name': 'Johnson',
                'email': 'burnthisway22+3@gmail.com',
                'username': 'budgetmanager',
                'phone_number': '+10000000013',  # Updated phone number to ensure uniqueness
                'role': 'Budget Manager',
                'is_staff': False,
                'profile_picture': 'https://i.pinimg.com/736x/d1/81/e4/d181e44cf0a7d5f9190bc96939da4164.jpg',
            },
            {
                'first_name': 'Alice',
                'last_name': 'Williams',
                'email': 'burnthisway22+4@gmail.com',
                'username': 'assetstaff',
                'phone_number': '+10000000014',  # Updated phone number to ensure uniqueness
                'role': 'Asset Manager',
                'is_staff': False,
                'profile_picture': 'https://i.pinimg.com/736x/7a/1e/4c/7a1e4c890c618df4132d895c1fc45f2a.jpg',
            },
        ]

        for user_data in predefined_users:
            role = self.roles.get(user_data['role'])
            if not role:
                self.stdout.write(self.style.ERROR(f"Role '{user_data['role']}' does not exist. Skipping user {user_data['email']}"))
                continue

            # Generate a profile image URL from ui-avatars.com using the user's name as the seed.
            seed = f"{user_data['first_name']} {user_data['last_name']}"
            generated_avatar = f"https://ui-avatars.com/api/?name={quote_plus(seed)}&background=0D8ABC&color=fff&size=256"
            # If a profile_picture was provided in the data, keep it as the source URL, otherwise use the generated one.
            profile_picture_url = user_data.get('profile_picture') or generated_avatar

            # Do not set the ImageField directly to a remote URL in defaults; save the user first, then download the image into MEDIA
            user, created = User.objects.get_or_create(
                email=user_data['email'],
                defaults={
                    'username': user_data['username'],
                    'first_name': user_data['first_name'],
                    'last_name': user_data['last_name'],
                    'phone_number': user_data['phone_number'],
                    'is_active': True,
                    'is_staff': user_data['is_staff'],
                    # don't set profile_picture here
                }
            )
            if created:
                user.set_password('password123')  # Default password
                user.save()
                self.stdout.write(f'Created user: {user.email} ({role.name})')
            else:
                self.stdout.write(f'User already exists: {user.email}')

            # Save/download profile picture into MEDIA if it's a remote URL and user has no stored picture
            try:
                if profile_picture_url and profile_picture_url.lower().startswith('http'):
                    # Only download if user has no profile picture stored yet
                    if not user.profile_picture or not getattr(user.profile_picture, 'name', None):
                        self.download_and_set_profile_picture(user, profile_picture_url)
                else:
                    # If profile_picture_url is a local path or None and user has none, skip
                    pass
            except Exception as e:
                self.stdout.write(self.style.WARNING(f'Error while setting profile picture for {user.email}: {e}'))

            # Now create or update the UserSystemRole with simplified structure
            try:
                user_role, ur_created = UserSystemRole.objects.get_or_create(
                    user=user,
                    system=self.tts_system,
                    role=role
                )
                
                if ur_created:
                    self.stdout.write(f'Assigned role {role.name} to {user.email} in {self.tts_system.name} system')
                else:
                    self.stdout.write(f'User {user.email} already has role {role.name} in {self.tts_system.name} system')
            except Exception as e:
                self.stdout.write(self.style.ERROR(f'Error assigning role to user: {str(e)}'))
                # Print more debug information
                self.stdout.write(self.style.WARNING(f"Available fields in UserSystemRole: {[f.name for f in UserSystemRole._meta.get_fields()]}"))