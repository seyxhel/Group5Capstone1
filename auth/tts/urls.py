from django.urls import path
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.reverse import reverse
from .views import UserIDsByRoleView

app_name = 'tts'

@api_view(['GET'])
def tts_root(request, format=None):
    return Response({
        'round-robin': reverse('tts:user_ids_by_role', request=request),
    })

urlpatterns = [
    path('', tts_root, name='tts_root'),
    path('round-robin/', UserIDsByRoleView.as_view(), name='user_ids_by_role'),
]