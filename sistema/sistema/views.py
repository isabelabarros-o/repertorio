# -*- coding: utf-8 *-
from django.contrib.auth import authenticate, login, logout
from django.views.generic import View
from django.shortcuts import render, redirect

class Login(View):
    """
    Class Based View para autenticação de usuários.
    """

    def get(self,request):
        contexto = {}
        if request.user.is_authenticated:
            return redirect("/repertorio")
        else:
            return render(request, 'autenticacao.html', contexto)
    
    def post(self,request):
        # Obtem as credenciais de autenticação
        usuario = request.POST.get('usuario', None)
        senha = request.POST.get('senha', None)

        user = authenticate(request, username=usuario, password=senha)
        if user is not None:
            if user.is_active:
                login(request, user)
                return redirect("/repertorio")
        else:
            return render(request, 'autenticacao.html', {'mensagem': 'Usuário ou senha inválidos!'})    
        
class Logout(View):
    """
    Class Based View para realizar logout de usuários.
    """

    def get(self,request):
        logout(request)
        return redirect("/")