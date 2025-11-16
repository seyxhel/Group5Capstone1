import secrets
from django.db import models

class APIKey(models.Model):
    name = models.CharField(max_length=100)
    key = models.CharField(max_length=40, unique=True, editable=False)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.key:
            self.key = secrets.token_hex(20)  # 40-char secure token
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name
