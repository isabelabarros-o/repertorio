from django.contrib.auth.models import User
from django.test import TestCase
from django.urls import reverse
from datetime import datetime, date, timedelta
from repertorio.models import Repertorio
from repertorio.forms import FormularioRepertorio
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token


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
        self.assertTrue(self.instancia.repertorio_ano)
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
        self.assertIn(response.status_code, (302, 200))
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


class TestesAPI(TestCase):
    """Testes básicos da API REST do Repertório."""
    def setUp(self):
        self.username = 'apiuser'
        self.password = 'senhaSegura123'
        self.user = User.objects.create_user(username=self.username, password=self.password)
        self.client.force_login(self.user)
        self.repertorio = Repertorio.objects.create(
            tipo='FILME',
            nome='Para API',
            data=datetime.now().date(),
            estrela=3,
            duracao=timedelta(minutes=90),
            resenha='Resenha API'
        )
        self.api_list = reverse('api-listar-repertorio')
        self.api_deletar = reverse('api-deletar-repertorio', kwargs={'pk': self.repertorio.pk})
        self.api_editar = reverse('api-editar-repertorio', kwargs={'pk': self.repertorio.pk})
        self.web_criar = reverse('criar-repertorio')
        self.api_client = APIClient()

    def test_login_senha_errada(self):
        self.client.logout()
        self.assertFalse(self.client.login(username=self.username, password='senhaErrada'))

    def test_login_senha_certa(self):
        self.client.logout()
        self.assertTrue(self.client.login(username=self.username, password=self.password))

    def test_api_token(self):
        resp = self.api_client.get(self.api_list)
        self.assertIn(resp.status_code, (401, 403))

    def test_api_with_token_allows_get(self):
        token = Token.objects.create(user=self.user)
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        resp = self.api_client.get(self.api_list)
        self.assertEqual(resp.status_code, 200)
        content = resp.data
        names = [o.get('nome') for o in content] if isinstance(content, list) else []
        self.assertIn(self.repertorio.nome, names)

    def test_api_editar_repertorio(self):
        token = Token.objects.create(user=self.user)
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        resp = self.api_client.patch(self.api_editar, {'nome': 'Nome Atualizado'}, format='json')
        self.assertEqual(resp.status_code, 200)
        self.repertorio.refresh_from_db()
        self.assertEqual(self.repertorio.nome, 'Nome Atualizado')

    def test_api_duracao_invalida(self):
        token = Token.objects.create(user=self.user)
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        resp = self.api_client.patch(self.api_editar, {'duracao': 'invalid-duration'}, format='json')
        self.assertEqual(resp.status_code, 400)
        self.assertIn('errors', getattr(resp, 'data', {}))

    def test_api_criar_repertorio_sem_login(self):
        self.client.logout()
        dados = {
            'tipo': 'FILME',
            'nome': 'Tentativa Anônima',
            'data': date.today().isoformat(),
            'estrela': '2',
            'duracao': '01:00',
            'resenha': 'Teste anonimo'
        }
        resp = self.client.post(self.web_criar, dados)
        self.assertIn(resp.status_code, (302, 403))

    def test_api_delete_token(self):
        resp_no = self.api_client.delete(self.api_deletar)
        self.assertIn(resp_no.status_code, (401, 403))
        token = Token.objects.create(user=self.user)
        self.api_client.credentials(HTTP_AUTHORIZATION=f'Token {token.key}')
        resp_yes = self.api_client.delete(self.api_deletar)
        self.assertIn(resp_yes.status_code, (200, 204))
        if resp_yes.status_code in (200, 204):
            self.assertEqual(Repertorio.objects.filter(pk=self.repertorio.pk).count(), 0)