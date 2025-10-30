from django.forms import ModelForm
from repertorio.models import Repertorio
class FormularioRepertorio(ModelForm):
    """
    Formulário para o model Veículo
    """

    class Meta:
        model = Repertorio
        exclude = []
