# Generated by Django 4.2.17 on 2025-02-18 09:44

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('admin_', '0005_log_changes'),
    ]

    operations = [
        migrations.AddField(
            model_name='changes',
            name='geo_data',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='admin_.geodata'),
        ),
        migrations.AddField(
            model_name='geodata',
            name='is_changing',
            field=models.BooleanField(default=False),
        ),
    ]
