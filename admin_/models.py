from django.contrib.auth.models import User
from django.contrib.gis.db import models
from jahad_.jalali import jalali_convert

class MainGeoData(models.Model):
    name = models.CharField()

    def __str__(self):
        return self.name


class GeoData(models.Model):
    main_geo = models.ForeignKey(MainGeoData, on_delete=models.CASCADE, blank=True, null=True)
    geom = models.GeometryField()
    property = models.JSONField(blank=True, null=True)
    image = models.ImageField(blank=True, null=True, upload_to='sardar')
    comment = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.property['ostan'] + " | " + self.property['onvan'] + ' | ' + self.property['vahed']

class MainBookmark(models.Model):
    name = models.CharField(max_length= 100)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    def __str__(self):
        return self.name

class BookmarkGeo(models.Model):
    bookmark = models.ForeignKey(MainBookmark, on_delete=models.CASCADE, blank=True, null=True)
    geom = models.GeometryField()
    property = models.JSONField(blank=True, null=True)
    image = models.ImageField(blank=True, null=True, upload_to='sardar')


class IranData(models.Model):
    geom = models.GeometryField()
    name = models.CharField(max_length=80, default='')

    def __str__(self):
        return self.name


class Log(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    name = models.CharField(max_length=200)
    text = models.TextField(blank=True, null=True)
    date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name + ' | ' + self.user.username


class Changes(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    geo_data = models.ForeignKey(GeoData, on_delete=models.CASCADE, blank=True, null=True)
    key = models.CharField(max_length=30)
    persian_key = models.CharField(max_length=30, blank=True, null=True)
    old_value = models.TextField()
    new_value = models.TextField()
    date = models.DateTimeField(auto_now_add=True)
    approved = models.BooleanField(default=False)

    def __str__(self):
        return self.user.username + ' | ' + self.key

    def jDate(self):
        return jalali_convert(self.date)

    @property
    def jDate_serializable(self):
        return self.jDate()

    def ostan(self):
        return self.geo_data.property['ostan']

    def vahed(self):
        return self.geo_data.property['vahed']

    def onvan(self):
        return self.geo_data.property['onvan']


class TemporaryChart(models.Model):
    geojson = models.JSONField()


class Documents(models.Model):
    name = models.CharField(max_length=200)
    geo_data = models.ForeignKey(GeoData, on_delete=models.CASCADE, blank=True, null=True)
    file = models.FileField(upload_to='documents')
    uploaded_date = models.DateField(auto_now_add=True)
    uploaded_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return self.name

    def upload_date_jalali(self):
        return jalali_convert(self.uploaded_date)

    def vahed_name(self):
        return self.geo_data.property['vahed']

    def onvan_name(self):
        return self.geo_data.property['onvan']

class UserComments(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    geo = models.ForeignKey(GeoData, on_delete=models.CASCADE)
    text = models.TextField()