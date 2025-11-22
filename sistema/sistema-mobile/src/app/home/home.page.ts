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
  IonIcon, IonButton  // <--- ADICIONADO PARA CORRIGIR O ERRO DO ÍCONE E ION-BUTTON
} from '@ionic/angular/standalone';
import { Storage } from '@ionic/storage-angular';
import { Repertorio } from './repertorio.model'; // Ajuste o caminho se necessário
import { Usuario } from '../login/usuario.model';
import { CapacitorHttp, HttpOptions, HttpResponse } from '@capacitor/core';
import { addIcons } from 'ionicons'; // addIcons registers icons for ion-icon
import { logOutOutline } from 'ionicons/icons'; // logout icon

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
  , IonButton // make <ion-button> available to the standalone component
  ],
  providers: [Storage]
})
export class HomePage implements OnInit { // <--- NOME DA CLASSE MUDADO

  public usuario: Usuario = new Usuario();
  public lista_repertorio: Repertorio[] = [];

  constructor(
    public storage: Storage,
    public controle_toast: ToastController,
    public controle_navegacao: NavController,
    public controle_carregamento: LoadingController
  ) { }

  // register the logout icon so <ion-icon name="log-out-outline"> resolves
  ngOnInitIcons(){
    try{
      addIcons({ 'log-out-outline': logOutOutline });
    }catch(e){ console.warn('ionicons register failed', e); }
  }

  async ngOnInit() {

    // Verifica se existe registro de configuração para o último usuário autenticado
    await this.storage.create();
    const registro = await this.storage.get('usuario');

    if(registro) {
      this.usuario = Object.assign(new Usuario(), registro);
  this.ngOnInitIcons();
  this.consultarRepertorioSistemaWeb();
    }
    else{
      this.controle_navegacao.navigateRoot('/login');
    }
  }

  async consultarRepertorioSistemaWeb() {

    // Inicializa interface com efeito de carregamento
    const loading = await this.controle_carregamento.create({message: 'Pesquisando...', duration: 60000});
    await loading.present();

    // Define informações do cabeçalho da requisição
    const options: HttpOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization':`Token ${this.usuario.token}`
      },
      url: 'http://127.0.0.1:8000/repertorio/api/'
    };

    CapacitorHttp.get(options)
      .then(async (resposta: HttpResponse) => {

        // Verifica se a requisição foi processada com sucesso
        if(resposta.status == 200) {
          // Normalize API objects into Repertorio instances so template helpers work
          try {
            const raw = resposta.data as any[];
            this.lista_repertorio = Array.isArray(raw) ? raw.map(r => new Repertorio(r)) : [];
          } catch (e) {
            this.lista_repertorio = [];
          }

          // Finaliza interface com efeito de carregamento
          loading.dismiss();
        }
        else {

          // Finaliza autenticação e apresenta mensagem de erro
          loading.dismiss();
          this.apresenta_mensagem(`Falha ao consultar repertórios: código ${resposta.status}`);
        }
      })
      .catch(async (erro: any) => {
        console.log(erro);
        loading.dismiss();
        this.apresenta_mensagem(`Falha ao consultar repertórios: código ${erro?.status}`);
      });
  }

  async excluirRepertorio(id: number) {

    // Inicializa interface com efeito de carregamento
    const loading = await this.controle_carregamento.create({message: 'Excluindo...', duration: 30000});
    await loading.present();

    const options: HttpOptions = {
      headers: {
        'Content-Type': 'application/json',
        'Authorization':`Token ${this.usuario.token}`
      },
      url: `http://127.0.0.1:8000/repertorio/api/${id}/`
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
          this.apresenta_mensagem(`Falha ao excluir o repertórios: código ${resposta.status}`);
        }
      })
.catch(async (erro: any) => {
        console.log(erro);
        loading.dismiss();
        this.apresenta_mensagem(`Falha ao excluir o repertórios: código ${erro?.status}`);
      })
      .finally(() => {

        // Consulta novamente a lista de repertórios
        this.lista_repertorio = [];
        this.consultarRepertorioSistemaWeb();
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

  async logout() {
    // Clear stored user and navigate to login
    try {
      await this.storage.clear();
    } catch (e) {
      console.warn('Erro ao limpar storage durante logout', e);
    }
    this.controle_navegacao.navigateRoot('/login');
  }

  // Receives duration in seconds (or as number) and formats to H:MM or HH:MM
  formatDuration(value: number | string | null | undefined): string {
    if (value == null) return '-';

    // If it's a number, assume seconds
    if (typeof value === 'number') {
      const total = Math.floor(value);
      const hours = Math.floor(total / 3600);
      const minutes = Math.floor((total % 3600) / 60);
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }

    const s = (value || '').toString().trim();
    if (!s) return '-';

    // Handle HH:MM:SS or MM:SS or H:MM
    if (s.includes(':')) {
      const parts = s.split(':').map(p => parseInt(p, 10));
      if (parts.some(isNaN)) return '-';
      let seconds = 0;
      if (parts.length === 3) seconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
      else if (parts.length === 2) seconds = parts[0] * 60 + parts[1];
      else if (parts.length === 1) seconds = parts[0];
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }

    // Handle ISO 8601 duration like 'PT1H30M' (basic support)
    const isoMatch = s.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
    if (isoMatch) {
      const h = parseInt(isoMatch[1] || '0', 10);
      const m = parseInt(isoMatch[2] || '0', 10);
      const sec = parseInt(isoMatch[3] || '0', 10);
      const total = h * 3600 + m * 60 + sec;
      const hours = Math.floor(total / 3600);
      const minutes = Math.floor((total % 3600) / 60);
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }

    // Last resort: try parse as integer seconds
    const parsed = parseInt(s, 10);
    if (!isNaN(parsed)) {
      const hours = Math.floor(parsed / 3600);
      const minutes = Math.floor((parsed % 3600) / 60);
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }

    return '-';
  }
}