from django.urls import path
from repertorio.views import *

urlpatterns = [
    path('', MeuRepertorio.as_view(), name='meu-repertorio'),
    # legacy / test alias for listing (some tests/templates expect this name)
    path('', MeuRepertorio.as_view(), name='listar-repertorio'),
    path('novo/', CriarRepertorio.as_view(), name='criar-repertorio'),
    path('editar/<int:pk>/', EditarRepertorio.as_view(), name='editar-repertorio'),
    path('deletar/<int:pk>/', DeletarRepertorio.as_view(), name='deletar-repertorio'),
    path('fotos/<str:arquivo>/', FotoRepertorio.as_view(), name='foto-repertorio'),
    path('api/', APIListarRepertorio.as_view(), name='api-listar-repertorio'),
    path('api/<int:pk>/', APIDeletarRepertorio.as_view(), name='api-deletar-repertorio'),
]