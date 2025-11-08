from django.contrib.auth.models import User
from django.test import TestCase, Client
from django.urls import reverse
from datetime import datetime, time, date
from repertorio.models import *
from repertorio.forms import *

class TestesModelRepertorio(TestCase):
    '''
    Classe de testes para o model Veículo
    '''
    def setUp(self):
        self.instancia = Repertorio(
            tipo='FILME',
            nome='Modelo Teste',
            data=datetime.now(),
            estrela=2,
            duracao=(1, 0, 0),
            resenha='Resenha de teste.'
        )
            
    def test_repertorio_novo(self):
        self.assertTrue(self.instancia.repertorio_ano)
        self.instancia.ano = datetime.now().year - 5
        self.assertFalse(self.instancia.repertorio_ano)


class TestesViewListarRepertorio(TestCase):
    '''
    Classe de testes para a view ListarRepertorio
    '''
    def setUp(self):
        self.user = User.objects.create(username='teste', password='12345')
        self.client.force_login(self.user)
        self.url = reverse('listar-repertorio')
        Repertorio(tipo='FILME',
            nome='Modelo Teste',
            data=datetime.now(),
            estrela=2,
            duracao=(1, 0, 0),
            resenha='Resenha de teste.').save()
        
    def test_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.context['lista_repertorio']), 1)
 
class TestesViewCriarRepertorio(TestCase):
    '''
    Classe de testes para a view CriarRepertorio
    '''
    def setUp(self):
        self.user = User.objects.create(username='teste', password='12345')
        self.client.force_login(self.user)
        self.url = reverse('criar-repertorio')

    def test_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.context.get('form'), FormularioRepertorio)

    def test_post(self):
        dados = {
            'tipo': 'FILME',
            'nome': 'Modelo Teste',
            'data': datetime.now(),
            'estrela': 2,
            'duracao': (1, 0, 0),
            'resenha': 'Resenha de teste.'
        }
        response = self.client.post(self.url, dados)
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('listar-repertorio'))
        self.assertEqual(Repertorio.objects.count(), 1)
        self.assertEqual(Repertorio.objects.first().tipo, 'FILME')
        self.assertEqual(Repertorio.objects.first().nome, 'Modelo Teste'1)
        self.assertEqual(Repertorio.objects.first().data, datetime.now())
        self.assertEqual(Repertorio.objects.first().estrela, 2)
        self.assertEqual(Repertorio.objects.first().duracao, 1:00:00)
        self.assertEqual(Repertorio.objects.first().resenha, 'Resenha de teste.')

class TestesViewEditarRepertorio(TestCase):
    '''
    Classe de testes para a view EditarRepertorio
    '''
    def setUp(self):
        self.user = User.objects.create(username='teste', password='12345')
        self.client.force_login(self.user)
        self.instancia = Repertorio.objects.create(
            tipo='FILME',
            nome='Modelo Teste',
            data=datetime.now(),
            estrela=2,
            duracao=1:00:00,
            resenha='Resenha de teste.'
        )
        self.url = reverse('editar-repertorio', kwargs={'pk': self.instancia.pk})

    def test_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.context.get('object'), Repertorio)
        self.assertIsInstance(response.context.get('form'), FormularioRepertorio)
        self.assertEqual(response.context.get('object').pk, self.instancia.pk)

    def test_post(self):
        dados = {
            'tipo': 'FILME',
            'nome': 'Modelo Teste Editado',
            'data': datetime.now(),
            'estrela': 2,
            'duracao': 1:00:00,
            'resenha': 'Resenha de teste editada.'
        }
        response = self.client.post(self.url, dados)
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('listar-repertorio'))
        self.assertEqual(self.instancia.nome, 'Modela Teste Editado')
        self.assertEqual(Repertorio.objects.count(), 1)
        self.assertEqual(Repertorio.objects.first().pk, self.instancia.pk)

class TestesViewDeletarRepertorio(TestCase):
    '''
    Classe de testes para a view DeletarRepertorio
    '''
    def setUp(self):
        self.user = User.objects.create(username='teste', password='12345')
        self.client.force_login(self.user)
        self.instancia = Repertorio.objects.create(
            tipo='FILME',
            nome='Modelo Teste',
            data=datetime.now(),
            estrela=2,
            duracao=(1, 0, 0),
            resenha='Resenha de teste.')
        self.url = reverse('deletar-repertorio', kwargs={'pk': self.instancia.pk})

    def test_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('listar-repertorio'))
        self.assertEqual(Repertorio.objects.count(), 0)

    def test_post(self):
        response = self.client.post(self.url)

        #Verifica se o redirecionamento ocorreu corretamente
        self.assertEqual(response.status_code, 302)
        self.assertRedirects(response, reverse('listar-repertorio'))
        self.assertEqual(Repertorio.objects.count(), 0)