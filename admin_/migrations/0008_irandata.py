# Generated by Django 4.2.17 on 2025-03-02 07:14

import django.contrib.gis.db.models.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('admin_', '0007_changes_approved'),
    ]

    operations = [
        migrations.CreateModel(
            name='IranData',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('geom', django.contrib.gis.db.models.fields.GeometryField(srid=4326)),
            ],
        ),
    ]
