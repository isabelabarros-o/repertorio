from django import forms
from django.forms import ModelForm
from repertorio.models import Repertorio
from datetime import timedelta, datetime
import re


class DurationHMField(forms.Field):
    """Custom form field that parses HH:MM as hours and minutes into timedelta.

    This ensures user-entered '01:30' becomes 1 hour 30 minutes (not 1 minute 30 seconds,
    which is how Django's DurationField parser can interpret 'MM:SS').
    """
    default_error_messages = {
        'invalid': 'Formato inválido. Use HH:MM (horas:minutos).',
    }

    def to_python(self, value):
        if value in (None, ''):
            return None
        if isinstance(value, timedelta):
            # normalize to hours/minutes
            total_seconds = int(value.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            return timedelta(hours=hours, minutes=minutes)

        if isinstance(value, str):
            value = value.strip()
            # accept formats like H:MM or HH:MM or HH:MM:SS (we ignore seconds)
            m = re.match(r'^(\d{1,2}):(\d{2})(?::(\d{2}))?$', value)
            if not m:
                raise forms.ValidationError(self.error_messages['invalid'])
            hours = int(m.group(1))
            minutes = int(m.group(2))
            return timedelta(hours=hours, minutes=minutes)

        # try numeric seconds fallback
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
            # duracao handled by explicit field below
            'temporada': forms.NumberInput(attrs={'class': 'form-control', 'min': 1}),
            'resenha': forms.Textarea(attrs={'class': 'form-control', 'rows': 4, 'placeholder': 'Escreva sua resenha...'}),
            'foto': forms.ClearableFileInput(attrs={'class': 'form-control', 'accept': 'image/*'}),
        }

    # explicit custom field so widget + parsing align
    duracao = DurationHMField(required=False, widget=forms.TextInput(attrs={
        'class': 'form-control',
        'placeholder': 'HH:MM',
        'pattern': '^\\d{1,2}:\\d{2}$',
        'title': 'Formato HH:MM (horas:minutos)'
    }))

    def clean_duracao(self):
        """Normalize `duracao` input into a timedelta (hours, minutes, seconds).

        The widget is a TimeInput so browsers provide values like 'HH:MM' or a
        time object. The model uses DurationField so we convert time -> timedelta
        to ensure hours:minutes are stored correctly.
        """
        value = self.cleaned_data.get('duracao')
        if value in (None, ''):
            return None

        # If already a timedelta, return as-is
        if isinstance(value, timedelta):
            # normalize to hours and minutes (discard seconds)
            total_seconds = int(value.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            return timedelta(hours=hours, minutes=minutes)
        # If it's a time object (from browser), convert (discard seconds)
        try:
            import datetime as _dt
            if isinstance(value, _dt.time):
                return timedelta(hours=value.hour, minutes=value.minute)
        except Exception:
            pass

        # If it's a string like 'HH:MM' or 'HH:MM:SS', parse it
        if isinstance(value, str):
            for fmt in ("%H:%M:%S", "%H:%M"):
                try:
                    t = datetime.strptime(value, fmt)
                    return timedelta(hours=t.hour, minutes=t.minute)
                except ValueError:
                    pass

        # Fallback: try numeric seconds, convert to hours/minutes (discard seconds)
        try:
            seconds = int(value)
            hours = seconds // 3600
            minutes = (seconds % 3600) // 60
            return timedelta(hours=hours, minutes=minutes)
        except Exception:
            pass

        # If we can't coerce, raise a ValidationError
        raise forms.ValidationError('Formato de duração inválido. Use HH:MM ou HH:MM:SS.')