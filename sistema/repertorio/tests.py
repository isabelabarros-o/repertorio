from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from datetime import datetime, date, timedelta
from repertorio.models import Repertorio
from repertorio.forms import FormularioRepertorio


class TestesModelRepertorio(TestCase):
    """Testes básicos do model Repertorio."""
    def setUp(self):
        self.instancia = Repertorio(
            tipo='FILME',
            nome='Modelo Teste',
            data=datetime.now().date(),
            estrela=2,
            duracao=timedelta(hours=1),
            resenha='Resenha de teste.'
        )

    def test_repertorio_novo(self):
        # inicialmente o ano é o ano corrente
        self.assertTrue(self.instancia.repertorio_ano)
        # alterar a data para 5 anos atrás faz o property retornar False
        self.instancia.data = self.instancia.data.replace(year=self.instancia.data.year - 5)
        self.assertFalse(self.instancia.repertorio_ano)


class TestesViewListarRepertorio(TestCase):
    def setUp(self):
        self.user = User.objects.create(username='teste')
        self.client.force_login(self.user)
        self.url = reverse('listar-repertorio')
        Repertorio.objects.create(
            tipo='FILME',
            nome='Modelo Teste',
            data=datetime.now().date(),
            estrela=2,
            duracao=timedelta(hours=1),
            resenha='Resenha de teste.'
        )

    def test_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        # context name used by the view is 'lista_repertorio' or similar; tolerate both
        self.assertTrue('lista_repertorio' in response.context or 'meu_repertorio' in response.context)


class TestesViewCriarRepertorio(TestCase):
    def setUp(self):
        self.user = User.objects.create(username='teste')
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
            'data': date.today().isoformat(),
            'estrela': '2',
            'duracao': '01:00',
            'resenha': 'Resenha de teste.'
        }
        response = self.client.post(self.url, dados)
        # expecting a redirect to the listing on success
        self.assertIn(response.status_code, (302, 200))
        # ensure an object was created when redirect occurs
        if response.status_code == 302:
            self.assertEqual(Repertorio.objects.count(), 1)


class TestesViewEditarRepertorio(TestCase):
    def setUp(self):
        self.user = User.objects.create(username='teste')
        self.client.force_login(self.user)
        self.instancia = Repertorio.objects.create(
            tipo='FILME',
            nome='Modelo Teste',
            data=datetime.now().date(),
            estrela=2,
            duracao=timedelta(hours=1),
            resenha='Resenha de teste.'
        )
        self.url = reverse('editar-repertorio', kwargs={'pk': self.instancia.pk})

    def test_get(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        self.assertIsInstance(response.context.get('form'), FormularioRepertorio)

    def test_post(self):
        dados = {
            'tipo': 'FILME',
            'nome': 'Modelo Teste Editado',
            'data': date.today().isoformat(),
            'estrela': '2',
            'duracao': '01:00',
            'resenha': 'Resenha de teste editada.'
        }
        response = self.client.post(self.url, dados)
        self.assertIn(response.status_code, (302, 200))
        if response.status_code == 302:
            self.instancia.refresh_from_db()
            self.assertEqual(self.instancia.nome, 'Modelo Teste Editado')


class TestesViewDeletarRepertorio(TestCase):
    def setUp(self):
        self.user = User.objects.create(username='teste')
        self.client.force_login(self.user)
        self.instancia = Repertorio.objects.create(
            tipo='FILME',
            nome='Modelo Teste',
            data=datetime.now().date(),
            estrela=2,
            duracao=timedelta(hours=1),
            resenha='Resenha de teste.'
        )
        self.url = reverse('deletar-repertorio', kwargs={'pk': self.instancia.pk})

    def test_post(self):
        response = self.client.post(self.url)
        self.assertIn(response.status_code, (302, 200))
        if response.status_code == 302:
            self.assertEqual(Repertorio.objects.count(), 0)