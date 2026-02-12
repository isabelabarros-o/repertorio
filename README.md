# 🎬 Repertório

Este projeto foi desenvolvido como trabalho final para a disciplina de **Desenvolvimento Webmobile 2025/2** do curso de **Ciência da Computação** na **Universidade Federal do Tocantins**.

O **Repertório** é um sistema para registrar filmes, séries e outros tipos de mídia consumidos, funcionando como um diário de experiências culturais para seus usuários.

---

## 🚀 Tecnologias e Frameworks

O projeto utiliza uma arquitetura full-stack composta por:

* **Backend:** Python ([Django](https://www.djangoproject.com/)) - Localizado no diretório `/sistema`.
* **Frontend Mobile:** TypeScript/JavaScript ([Ionic](https://ionicframework.com/) / [Angular](https://angular.io/)) - Localizado no diretório `/webmobile`.
* **Estilização:** CSS e SCSS para interfaces responsivas.
* **Lógica:** JavaScript para interatividade no frontend web.

---

## 📁 Estrutura do Projeto

* **`/sistema`**: Contém a lógica de backend, modelos de dados e API desenvolvida em Django.
* **`/webmobile`**: Contém o código da aplicação mobile/front-end desenvolvida com Ionic.
* **`/css` & `/js`**: Ativos estáticos para a interface web.

---

## 🔧 Configuração e Instalação

### 1. Pré-requisito: Node.js

Você precisa do Node.js instalado para gerenciar as dependências do frontend.

* **Windows/macOS:** Baixe o instalador oficial (versão LTS recomendada) em [nodejs.org](https://nodejs.org/).
* **Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install nodejs npm

```


> Verifique a instalação com o comando: `node -v`



### 2. Backend (Django)

Navegue até a pasta do servidor para configurar o ambiente Python:

```bash
# Entrar no diretório do sistema
cd sistema

# Criar o ambiente virtual (venv)
python -m venv venv

# Ativar o ambiente virtual
# No Windows:
venv\Scripts\activate
# No Linux/Mac:
source venv/bin/activate

# Instalar as bibliotecas fundamentais
pip install django django-cors-headers djangorestframework

# Preparar o banco de dados e as tabelas
python manage.py migrate

# Iniciar o servidor de desenvolvimento
python manage.py runserver

```

### 3. Frontend Mobile (Ionic)

Com o Node.js instalado, configure a aplicação mobile:

```bash
# Entrar no diretório webmobile
cd webmobile

# Instalar o CLI do Ionic globalmente
npm install -g @ionic/cli

# Instalar as dependências do projeto
npm install

# Iniciar a aplicação no navegador
ionic serve

```

---

## 🎓 Contexto Acadêmico

* **Instituição:** Universidade Federal do Tocantins (UFT) - Campus Palmas.
* **Curso:** Ciência da Computação.
* **Disciplina:** Desenvolvimento Webmobile.
* **Semestre:** 2025/2.

## 📝 Licença

Este projeto é de caráter educacional e acadêmico.

---

Desenvolvido por [Isabela Barros](https://github.com/isabelabarros-o)

---
