from rest_framework import serializers
from repertorio.models import Repertorio

class SerializadorRepertorio(serializers.ModelSerializer):
    """
    Serializador para o modelo Repertorio.
    """
    
    class Meta:
        model = Repertorio
        fields = '__all__'
        extra_kwargs = {
            'duracao': {'required': False, 'allow_null': True}
        }