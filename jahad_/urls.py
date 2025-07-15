
from django.contrib import admin
from django.urls import path, include
from django.conf.urls.static import static
from jahad_ import settings

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('admin_.urls')),
    path('', include('mainApp.urls')),
    path('', include('Account.urls')),
]
if settings.DEBUG:
    urlpatterns = urlpatterns + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns = urlpatterns + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
