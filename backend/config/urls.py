from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/', include('apps.projects.urls')),
    path('api/services/', include('apps.services.urls')),
    path('api/money/', include('apps.money.urls')),
    path('api/support/', include('apps.support.urls')),
    path('api/tools/', include('apps.tools.urls')),
]