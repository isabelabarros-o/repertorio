from django import forms
from django.forms import ModelForm
from repertorio.models import Repertorio
from datetime import timedelta, datetime
import re


class DurationHMField(forms.Field):
    """
    Campo de formulário personalizado que analisa HH:MM como horas e minutos em um timedelta.
    Garante que o valor inserido pelo usuário '01:30' seja interpretado como 1 hora e 30 minutos (e não 1 minuto e 30 segundos, que é como o analisador DurationField do Django interpreta 'MM:SS').
    """
    default_error_messages = {
        'invalid': 'Formato inválido. Use HH:MM (horas:minutos).',
    }

    def to_python(self, value):
        if value in (None, ''):
            return None
        if isinstance(value, timedelta):
            total_seconds = int(value.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            return timedelta(hours=hours, minutes=minutes)

        if isinstance(value, str):
            value = value.strip()
            m = re.match(r'^(\d{1,2}):(\d{2})(?::(\d{2}))?$', value)
            if not m:
                raise forms.ValidationError(self.error_messages['invalid'])
            hours = int(m.group(1))
            minutes = int(m.group(2))
            return timedelta(hours=hours, minutes=minutes)

        try:
            seconds = int(value)
            hours = seconds // 3600
            minutes = (seconds % 3600) // 60
            return timedelta(hours=hours, minutes=minutes)
        except Exception:
            raise forms.ValidationError(self.error_messages['invalid'])




class FormularioRepertorio(ModelForm):
    """Formulário para o model Repertório com widgets apropriados."""

    class Meta:
        model = Repertorio
        exclude = []
        widgets = {
            'nome': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Nome do repertório'}),
            'tipo': forms.Select(attrs={'class': 'form-select'}),
            'data': forms.DateInput(attrs={'class': 'form-control', 'type': 'date'}),
            'estrela': forms.Select(attrs={'class': 'form-select'}),
            'temporada': forms.NumberInput(attrs={'class': 'form-control', 'min': 1}),
            'resenha': forms.Textarea(attrs={'class': 'form-control', 'rows': 4, 'placeholder': 'Escreva sua resenha...'}),
            'foto': forms.ClearableFileInput(attrs={'class': 'form-control', 'accept': 'image/*'}),
        }

    duracao = DurationHMField(required=False, widget=forms.TextInput(attrs={
        'class': 'form-control',
        'placeholder': 'HH:MM',
        'pattern': '^\\d{1,2}:\\d{2}$',
        'title': 'Formato HH:MM (horas:minutos)'
    }))

    def clean_duracao(self):
        """Normalizar a entrada `duracao` em um timedelta (horas, minutos, segundos).
        O widget é um TimeInput, portanto, os navegadores fornecem valores como 'HH:MM' ou um objeto de tempo.
        O modelo usa DurationField, então convertemos tempo -> timedelta para garantir que horas:minutos sejam armazenados corretamente.
        """
        value = self.cleaned_data.get('duracao')
        if value in (None, ''):
            return None

        if isinstance(value, timedelta):
            total_seconds = int(value.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            return timedelta(hours=hours, minutes=minutes)
        try:
            import datetime as _dt
            if isinstance(value, _dt.time):
                return timedelta(hours=value.hour, minutes=value.minute)
        except Exception:
            pass

        if isinstance(value, str):
            for fmt in ("%H:%M:%S", "%H:%M"):
                try:
                    t = datetime.strptime(value, fmt)
                    return timedelta(hours=t.hour, minutes=t.minute)
                except ValueError:
                    pass

        try:
            seconds = int(value)
            hours = seconds // 3600
            minutes = (seconds % 3600) // 60
            return timedelta(hours=hours, minutes=minutes)
        except Exception:
            pass

        raise forms.ValidationError('Formato de duração inválido. Use HH:MM ou HH:MM:SS.')