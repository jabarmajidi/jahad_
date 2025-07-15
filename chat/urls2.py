
from django.contrib import admin
from django.urls import path 
from . import views

urlpatterns = [
    #path('admin/', views.index,name = 'index'),
    path('', views.index,name='index'),
    path('request', views.chatBot,name='chatBot')
]