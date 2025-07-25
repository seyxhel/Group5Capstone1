"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
import os
import mimetypes
from django.http import Http404, HttpResponse

def media_serve_with_cors(request, path, document_root=None):
    full_path = os.path.join(document_root, path)
    if not os.path.exists(full_path):
        raise Http404("File does not exist")

    filetype, _ = mimetypes.guess_type(full_path)
    filename = os.path.basename(full_path)
    ext = os.path.splitext(filename)[1].lower()
    # Read file in binary mode
    with open(full_path, 'rb') as f:
        file_data = f.read()

    response = HttpResponse(file_data, content_type=filetype or 'application/octet-stream')
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Headers"] = "Range"
    response["Access-Control-Expose-Headers"] = "Content-Range, Content-Length"
    response["X-Served-By"] = "django-media-serve"
    response["Content-Length"] = os.path.getsize(full_path)

    # Set Content-Disposition (by MIME type or extension)
    if filetype in [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",       # .xlsx
        "text/csv"
    ] or ext in [".docx", ".xlsx", ".csv"]:
        response["Content-Disposition"] = f'attachment; filename="{filename}"'
    else:
        response["Content-Disposition"] = f'inline; filename="{filename}"'

    return response

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('core.urls')),
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
else:
    urlpatterns += [
        re_path(r'^media/(?P<path>.*)$', media_serve_with_cors, {'document_root': settings.MEDIA_ROOT}),
    ]
