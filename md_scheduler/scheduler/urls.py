from django.urls import path

from . import views

urlpatterns = [
    path('', views.index, name='index'),
    path('about', views.about, name='about'),
    path('ajax/generate_programs', views.generate_programs, name='generate_programs'),
]