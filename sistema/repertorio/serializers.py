from rest_framework import serializers
from repertorio.models import Repertorio

class SerializadorRepertorio(serializers.ModelSerializer):
    """
    Serializador para o modelo Veículo
    """
    class Meta:
        model = Repertorio
        exclude = []  