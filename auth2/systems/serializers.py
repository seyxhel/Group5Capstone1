from rest_framework import serializers
from .models import *

class SystemSerializer(serializers.ModelSerializer):
    class Meta:
        model = System
        fields = '__all__'
