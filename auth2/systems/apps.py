from django.apps import AppConfig


class SystemsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'systems'
    
    def ready(self):
        import systems.models  # This will register the signals
