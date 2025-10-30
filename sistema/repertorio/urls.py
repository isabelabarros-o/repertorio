from django.urls import path
from repertorio.views import *

urlpatterns = [
    path('', MeuRepertorio.as_view(), name='meu-repertorio'),
    path('novo/', CriarRepertorio.as_view(), name='criar-repertorio'),
    path('fotos/<str:arquivo>/', FotoRepertorio.as_view(), name='foto-repertorio'),
    path('api/', APIListarRepertorio.as_view(), name='api-listar-repertorio'),
]