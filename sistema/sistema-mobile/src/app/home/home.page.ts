import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
// Importe todos os componentes que você está usando no HTML
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  LoadingController, NavController, ToastController, 
  IonButtons, IonMenuButton, IonText, IonCard, 
  IonCardHeader, IonCardTitle, IonCardSubtitle, 
  IonCardContent, IonList, IonItem, IonItemSliding, 
  IonThumbnail, IonLabel, IonItemOptions, IonItemOption,
  IonIcon  // <--- ADICIONADO PARA CORRIGIR O ERRO DO ÍCONE
} from '@ionic/angular/standalone';
import { Storage } from '@ionic/storage-angular';
import { Veiculo } from './veiculo.model'; // Ajuste o caminho se necessário
import { Usuario } from '../login/usuario.model';
import { CapacitorHttp, HttpOptions, HttpResponse } from '@capacitor/core';
import { addIcons } from 'ionicons'; // <--- Importe a função para adicionar ícones
import { carSportOutline } from 'ionicons/icons'; // <--- Importe o ícone específico

@Component({
  standalone: true,
  selector: 'app-home', // <--- MUDADO
  templateUrl: './home.page.html', // <--- MUDADO
  styleUrls: ['./home.page.scss'], // <--- MUDADO
  imports: [
    // Módulos principais do Angular
    CommonModule, 
    FormsModule, 
    
    // Todos os componentes Ionic importados
    IonItemOption, IonItemOptions, IonLabel, IonItemSliding, 
    IonItem, IonList, IonCardContent, IonCardSubtitle, 
    IonCardTitle, IonCardHeader, IonCard, IonText, 
    IonButtons, IonMenuButton, IonContent, IonHeader, 
    IonTitle, IonToolbar, IonThumbnail, IonIcon // <--- ADICIONADO
  ],
  providers: [Storage]
})
export class HomePage implements OnInit { // <--- NOME DA CLASSE MUDADO

  public usuario: Usuario = new Usuario();
  public lista_veiculos: Veiculo[] = [];

  constructor(
    public storage: Storage,
    public controle_toast: ToastController,
    public controle_navegacao: NavController,
    public controle_carregamento: LoadingController
  ) { }

  async ngOnInit() {

    // Verifica se existe registro de configuração para o último usuário autenticado
    await this.storage.create();
    const registro = await this.storage.get('usuario');

    if(registro) {
      this.usuario = Object.assign(new Usuario(), registro);
      this.consultarVeiculosSistemaWeb();
    }
    else{
      this.controle_navegacao.navigateRoot('/login');
    }
  }

  async consultarVeiculosSistemaWeb() {

    // Inicializa interface com efeito de carregamento
    const loading = await this.controle_carregamento.create({message: 'Pesquisando...', duration: 60000});
    await loading.present();

    // Define informações do cabeçalho da requisição
    const options: HttpOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization':`Token ${this.usuario.token}`
      },
      url: 'http://127.0.0.1:8000/veiculo/api/'
    };

    CapacitorHttp.get(options)
      .then(async (resposta: HttpResponse) => {

        // Verifica se a requisição foi processada com sucesso
        if(resposta.status == 200) {
          this.lista_veiculos = resposta.data;
        
          // Finaliza interface com efeito de carregamento
          loading.dismiss();
        }
        else {

          // Finaliza autenticação e apresenta mensagem de erro
          loading.dismiss();
          this.apresenta_mensagem(`Falha ao consultar veículos: código ${resposta.status}`);
        }
      })
      .catch(async (erro: any) => {
        console.log(erro);
        loading.dismiss();
        this.apresenta_mensagem(`Falha ao consultar veículos: código ${erro?.status}`);
      });
  }

  async excluirVeiculo(id: number) {

    // Inicializa interface com efeito de carregamento
    const loading = await this.controle_carregamento.create({message: 'Excluindo...', duration: 30000});
    await loading.present();

    const options: HttpOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization':`Token ${this.usuario.token}`
      },
      url: `http://127.0.0.1:8000/veiculo/api/${id}/`
    };

    CapacitorHttp.delete(options)
      .then(async (resposta: HttpResponse) => {

        // Verifica se a requisição foi processada com sucesso
        if(resposta.status == 204) {
          
          // Finaliza interface com efeito de carregamento
          loading.dismiss();
        }
        else {

          // Finaliza autenticação e apresenta mensagem de erro
          loading.dismiss();
          this.apresenta_mensagem(`Falha ao excluir o veículo: código ${resposta.status}`);
        }
      })
.catch(async (erro: any) => {
        console.log(erro);
        loading.dismiss();
        this.apresenta_mensagem(`Falha ao excluir o veículo: código ${erro?.status}`);
      })
      .finally(() => {

        // Consulta novamente a lista de veículos
        this.lista_veiculos = [];
        this.consultarVeiculosSistemaWeb();
      });
  }

  async apresenta_mensagem(texto: string) {
    const mensagem = await this.controle_toast.create({
      message: texto,
      cssClass: 'ion-text-center',
      duration: 2000
    });
    mensagem.present();
  }
}