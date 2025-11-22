from django.db import models
from repertorio.consts import OPCOES_ESTRELA
from datetime import datetime
# Create your models here.
class Repertorio(models.Model):

    class TipoRepertorio(models.TextChoices):
        FILME = 'FILME', 'Filme'
        SERIE = 'SERIE', 'Série'
        OUTRO = 'OUTRO', 'Outro'

    nome = models.CharField(max_length=100)
    data = models.DateField()
    estrela = models.SmallIntegerField(choices=OPCOES_ESTRELA)
    resenha = models.CharField(max_length=500)
    tipo = models.CharField(
        max_length=5,
        choices=TipoRepertorio.choices,
        default=TipoRepertorio.FILME, # Define 'Filme' como padrão
        help_text="Selecione se é um filme ou uma série."
    )
    duracao = models.DurationField(
        null=True, 
        blank=True,
        help_text="Duração do filme (ex: '01:45:00' para 1h 45m)."
    )
    temporada = models.PositiveSmallIntegerField(
        null=True, 
        blank=True,
        help_text="Número da temporada (apenas se for série)."
    )
    foto = models.ImageField(blank=True, null=True, upload_to='repertorio/fotos')

    @property
    def repertorio_ano(self):
        return self.data.year == datetime.now().year
