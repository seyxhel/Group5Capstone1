from django.db import models
from django.utils.timezone import now

class Role(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=150)
    system = models.ForeignKey('systems.System', on_delete=models.CASCADE, related_name='roles')
    description = models.TextField(blank=True, null=True)
    is_custom = models.BooleanField(default=False)
    created_at = models.DateTimeField(default=now)

    class Meta:
        unique_together = ('system', 'name')  # Prevent same role name in same system
        
    def __str__(self):
        # Show role name and system name for clarity in admin
        return f"{self.name} ({self.system.name})"
