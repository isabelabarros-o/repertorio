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
from rest_framework.generics import ListAPIView, DestroyAPIView, UpdateAPIView
from rest_framework.parsers import JSONParser
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Q
import logging

class MeuRepertorio(LoginRequiredMixin, ListView):
    model = Repertorio
    context_object_name = 'meu_repertorio'
    template_name = 'repertorio/listar.html'

    def get_queryset(self):
        qs = super().get_queryset()
        q = (self.request.GET.get('q') or '').strip()
        if not q:
            return qs
        try:
            estrela_val = int(q)
            estrela_q = Q(estrela=estrela_val)
        except Exception:
            estrela_q = Q()
        return qs.filter(
            Q(nome__icontains=q) |
            Q(resenha__icontains=q) |
            Q(tipo__icontains=q) |
            estrela_q
        ).distinct()

class CriarRepertorio(LoginRequiredMixin, CreateView):
    model = Repertorio
    form_class = FormularioRepertorio
    template_name = 'repertorio/novo.html'
    success_url = reverse_lazy('meu-repertorio')

class FotoRepertorio(View):
    def get(self, request, arquivo):
        try:
            repertorio = Repertorio.objects.get(foto='repertorio/fotos/{}'.format(arquivo))
            return FileResponse(repertorio.foto)
        except ObjectDoesNotExist:
                raise Http404("Repertório não possui foto.")
        except Exception as exception:
            raise exception

class EditarRepertorio(LoginRequiredMixin, UpdateView):
    """
    View para editar um veículo existente.
    """
    model = Repertorio
    form_class = FormularioRepertorio
    template_name = 'repertorio/editar.html'
    success_url = reverse_lazy('meu-repertorio')

class DeletarRepertorio(LoginRequiredMixin, DeleteView):
    '''
    View para deletar um veículo existente.
    '''
    model = Repertorio
    template_name = 'repertorio/deletar.html'
    success_url = reverse_lazy('meu-repertorio')


class APIListarRepertorio(ListAPIView):
    '''
    View para listar os veículos (por meio da API REST).
    '''
    serializer_class = SerializadorRepertorio
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Repertorio.objects.all()
        q = (self.request.query_params.get('q') or '').strip()
        if not q:
            return qs
        try:
            estrela_val = int(q)
            estrela_q = Q(estrela=estrela_val)
        except Exception:
            estrela_q = Q()
        return qs.filter(
            Q(nome__icontains=q) |
            Q(resenha__icontains=q) |
            Q(tipo__icontains=q) |
            estrela_q
        ).distinct()
    
class APIDeletarRepertorio(DestroyAPIView):
    '''
    View para deletar um repertório existente (por meio da API REST).
    '''
    serializer_class = SerializadorRepertorio
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Repertorio.objects.all()

class APIEditarRepertorio(UpdateAPIView):
    '''
    View para editar um repertório existente (por meio da API REST).
    '''
    serializer_class = SerializadorRepertorio
    authentication_classes = [TokenAuthentication]
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [JSONParser]

    def get_queryset(self):
        return Repertorio.objects.all()

    def update(self, request, *args, **kwargs):
        logger = logging.getLogger(__name__)
        partial = kwargs.pop('partial', False) or (request.method.upper() == 'PATCH')
        instance = self.get_object()
        logger.debug("APIEditarRepertorio request.data: %s", request.data)
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        if not serializer.is_valid():
            logger.debug("APIEditarRepertorio validation errors: %s", serializer.errors)
            return Response({'detail': 'Validation error', 'errors': serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST)
        self.perform_update(serializer)
        return Response(serializer.data, status=status.HTTP_200_OK)