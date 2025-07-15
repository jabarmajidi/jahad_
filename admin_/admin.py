from django.contrib import admin
from .models import *


class IranDataAdmin(admin.ModelAdmin):
    list_display = ('id', 'name')


class GeoDataAdmin(admin.ModelAdmin):
    search_fields = ('id',)


admin.site.register(GeoData, GeoDataAdmin)
admin.site.register(MainBookmark)
admin.site.register(BookmarkGeo)
admin.site.register(IranData, IranDataAdmin)
admin.site.register(Changes)
admin.site.register(Log)
admin.site.register(Documents)
admin.site.register(TemporaryChart)
admin.site.register(MainGeoData)
