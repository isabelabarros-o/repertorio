from django.views.generic import ListView, CreateView, UpdateView, DeleteView
from repertorio.models import Repertorio
from django.contrib.auth.mixins import LoginRequiredMixin
from repertorio.forms import FormularioRepertorio
from django.urls import reverse_lazy
from datetime import datetime
from django.views import View
from django.http import FileResponse, Http404
from django.core.exceptions import ObjectDoesNotExist
from repertorio.serializers import SerializadorRepertorio
from rest_framework.authentication import TokenAuthentication
from rest_framework import permissions
from rest_framework.generics import ListAPIView, DestroyAPIView

class MeuRepertorio(LoginRequiredMixin, ListView):
    model = Repertorio
    context_object_name = 'meu_repertorio'
    template_name = 'repertorio/listar.html'
    
class CriarRepertorio(LoginRequiredMixin, CreateView):
    model = Repertorio
    form_class = FormularioRepertorio
    template_name = 'repertorio/novo.html'
    success_url = reverse_lazy('meu_repertorio')

class FotoRepertorio(View):
    def get(self, request, arquivo):
        try:
            repertorio = Repertorio.objects.get(foto='repertorio/fotos/{}'.format(arquivo))
            return FileResponse(repertorio.foto)
        except ObjectDoesNotExist:
                raise Http404("Veículo não possui foto.")
        except Exception as exception:
            raise exception
        
class EditarRepertorio(LoginRequiredMixin, UpdateView):
    """
    View para editar um veículo existente.
    """
    model = Repertorio
    form_class = FormularioRepertorio
    template_name = 'repertorio/editar.html'
    success_url = reverse_lazy('listar-repertorio')

class DeletarRepertorio(LoginRequiredMixin, DeleteView):
    '''
    View para deletar um veículo existente.
    '''
    model = Repertorio
    template_name = 'repertorio/deletar.html'
    success_url = reverse_lazy('listar-repertorio')


class APIListarRepertorio(ListAPIView):
    '''
    View para listar os veículos (por meio da API REST).
    '''
    serializer_class = SerializadorRepertorio
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Repertorio.objects.all()
    
class APIDeletarRepertorio(DestroyAPIView):
    '''
    View para deletar um veículo (por meio da API REST).
    '''
    serializer_class = SerializadorRepertorio
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Repertorio.objects.all()