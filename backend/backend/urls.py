"""
URL configuration for backend project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include, re_path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from django.http import FileResponse, Http404
from django.views.static import serve as static_serve
import mimetypes

def media_serve_with_cors(request, path, document_root=None):
    response = static_serve(request, path, document_root=document_root)
    response["Access-Control-Allow-Origin"] = "*"
    response["Access-Control-Allow-Headers"] = "Range"
    response["Access-Control-Expose-Headers"] = "Content-Range, Content-Length"
    response["X-Served-By"] = "django-media-serve"
    filetype, _ = mimetypes.guess_type(path)
    # --- Always set Content-Disposition for these types, as the VERY LAST STEP ---
    if filetype in [
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",  # .docx
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",       # .xlsx
        "text/csv"
    ]:
        cd = f'attachment; filename="{path.split("/")[-1]}"'
        response["Content-Disposition"] = cd
        try:
            response.headers["Content-Disposition"] = cd
        except Exception:
            pass
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
