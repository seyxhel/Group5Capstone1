from django.core.management.base import BaseCommand
from django.core.management import call_command
from django.db import transaction


class Command(BaseCommand):
    help = 'Seed the database with all required data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--flush',
            action='store_true',
            help='Flush the database before seeding',
        )

    @transaction.atomic
    def handle(self, *args, **options):
        if options['flush']:
            self.stdout.write(self.style.WARNING('Flushing database...'))
            call_command('flush', '--no-input')
            self.stdout.write(self.style.SUCCESS('Database flushed successfully!'))
        
        self.stdout.write(self.style.NOTICE('Starting database seeding...'))
        
        # Call each seeding command in the appropriate order
        
        # 1. First seed systems as roles depend on them
        self.stdout.write(self.style.NOTICE('Seeding systems...'))
        call_command('seed_systems')
        
        # 2. Then seed roles as users with roles depend on them
        self.stdout.write(self.style.NOTICE('Seeding roles...'))
        call_command('seed_roles')
        
        # 3. Seed users
        self.stdout.write(self.style.NOTICE('Seeding users...'))
        call_command('seed_users')
        
        # 4. Seed system-specific data
        self.stdout.write(self.style.NOTICE('Seeding TTS data...'))
        call_command('seed_tts')
        
        # Add additional seed commands as needed
        # self.stdout.write(self.style.NOTICE('Seeding other system...'))
        # call_command('seed_other_system')
        
        self.stdout.write(self.style.SUCCESS('All data has been seeded successfully!'))