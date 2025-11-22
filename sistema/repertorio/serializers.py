from rest_framework import serializers
from repertorio.models import Repertorio

class SerializadorRepertorio(serializers.ModelSerializer):
    """
    Serializador para o modelo Repertorio.
    """
    
    class Meta:
        model = Repertorio
        # Explicitly include all fields and allow duracao to be null/optional
        fields = '__all__'
        extra_kwargs = {
            'duracao': {'required': False, 'allow_null': True}
        }