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
  IonIcon, IonButton, IonModal, IonInput, IonSelect, IonSelectOption, IonTextarea  // <--- ADICIONADO PARA CORRIGIR O ERRO DO ÍCONE E ION-BUTTON
} from '@ionic/angular/standalone';
import { Storage } from '@ionic/storage-angular';
import { Repertorio } from './repertorio.model'; // Ajuste o caminho se necessário
import { Usuario } from '../login/usuario.model';
import { CapacitorHttp, HttpOptions, HttpResponse } from '@capacitor/core';
import { addIcons } from 'ionicons'; // addIcons registers icons for ion-icon
import { logOutOutline, createOutline, trashOutline } from 'ionicons/icons'; // logout, edit, delete icons

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
  , IonButton, IonModal, IonInput, IonSelect, IonSelectOption, IonTextarea // make <ion-button> available to the standalone component
  ],
  providers: [Storage]
})
export class HomePage implements OnInit {
  public usuario: Usuario = new Usuario();
  public lista_repertorio: Repertorio[] = [];
  public editing: boolean = false;
  public editModel: any = {};
  public showDuracao = true;
  public showTemporada = false;

  constructor(
    public storage: Storage,
    public controle_toast: ToastController,
    public controle_navegacao: NavController,
    public controle_carregamento: LoadingController
  ) { }

  // Expose a safe display string for the header (avoids template type error)
  get userDisplay(): string {
    const u: any = this.usuario as any;
    return (u && (u.nome || u.usuario || u.username)) ? (u.nome || u.usuario || u.username) : '';
  }

  // register the logout icon so <ion-icon name="log-out-outline"> resolves
  ngOnInitIcons(){
    try{
      addIcons({
        'log-out-outline': logOutOutline,
        'create-outline': createOutline,
        'trash-outline': trashOutline
      });
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
      url: `http://127.0.0.1:8000/repertorio/api/deletar/${id}/`
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

  // novo método para navegar à edição (faz PATCH mínimo via API)
  async editarRepertorio(id: number, item?: any) {
    try {
      // pede valores ao usuário
      const novoNome = window.prompt('Editar nome do repertório (deixe em branco para não alterar):', item?.nome || '');
      if (novoNome === null) return; // usuário cancelou

      const novaResenha = window.prompt('Editar resenha (deixe em branco para não alterar):', item?.resenha || '');
      if (novaResenha === null) return; // usuário cancelou

      // monta payload incluindo apenas campos não vazios
      const payload: any = {};
      if (typeof novoNome === 'string' && novoNome.trim().length > 0) payload.nome = novoNome.trim();
      if (typeof novaResenha === 'string' && novaResenha.trim().length > 0) payload.resenha = novaResenha.trim();

      if (Object.keys(payload).length === 0) {
        this.apresenta_mensagem('Nenhuma alteração informada.');
        return;
      }

      const loading = await this.controle_carregamento.create({ message: 'Atualizando...', duration: 30000 });
      await loading.present();

      const options: any = {
        url: `http://127.0.0.1:8000/repertorio/api/editar/${id}/`,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${this.usuario.token}`
        },
        data: payload
      };

      CapacitorHttp.patch(options)
        .then(async (resposta: any) => {
          loading.dismiss();
          if (resposta.status === 200) {
            this.apresenta_mensagem('Repertório atualizado com sucesso.');
            this.consultarRepertorioSistemaWeb();
          } else {
            // mostra mensagem genérica e, se houver body, logue para debug
            console.warn('PATCH resposta:', resposta);
            this.apresenta_mensagem(`Falha ao atualizar: código ${resposta.status}`);
          }
        })
        .catch(async (erro: any) => {
          loading.dismiss();
          console.error('PATCH erro:', erro);
          // se o backend retornar JSON com detalhes, mostre ao usuário / log
          const detalhe = erro?.message || (erro?.error ? JSON.stringify(erro.error) : null);
          this.apresenta_mensagem(`Erro ao atualizar repertório: ${detalhe || 'ver console'}`);
        });

    } catch (e) {
      console.error('editarRepertorio error', e);
    }
  }

  openEditModal(item: any) {
    // prepara modelo de edição com valores atuais
    this.editModel = {
      id: item.id,
      nome: item.nome ?? '',
      tipo: item.tipo ?? '',
      estrela: item.estrela ?? null,
      duracao: item.duracao ?? null,
      temporada: item.temporada ?? null,
      resenha: item.resenha ?? ''
    };
    this.showDuracao = (this.editModel.tipo === 'FILME');
    this.showTemporada = (this.editModel.tipo === 'SERIE');
    this.editing = true;
  }

  closeEditModal() {
    this.editing = false;
    this.editModel = {};
  }

  onTipoChange() {
    this.showDuracao = (this.editModel.tipo === 'FILME');
    this.showTemporada = (this.editModel.tipo === 'SERIE');
  }

  async saveEdit() {
    if (!this.editModel || !this.editModel.id) return;

    // monta payload: envie todos os campos (se quiser enviar apenas alterados, ajuste)
    const payload: any = {
      nome: (this.editModel.nome || '').trim(),
      tipo: this.editModel.tipo || null,
      estrela: this.editModel.estrela ?? null,
      duracao: (this.editModel.duracao || null),
      temporada: (this.editModel.temporada !== undefined ? this.editModel.temporada : null),
      resenha: (this.editModel.resenha || '').trim()
    };

    // remove keys com valor null/undefined para evitar validação que exija campos
    Object.keys(payload).forEach(k => {
      if (payload[k] === null || payload[k] === undefined || payload[k] === '') {
        delete payload[k];
      }
    });

    const loading = await this.controle_carregamento.create({ message: 'Salvando...', duration: 30000 });
    await loading.present();

    const options: any = {
      url: `http://127.0.0.1:8000/repertorio/api/editar/${this.editModel.id}/`,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Token ${this.usuario.token}`
      },
      data: payload
    };

    CapacitorHttp.patch(options)
      .then(async (resposta: any) => {
        loading.dismiss();
        if (resposta.status === 200) {
          this.apresenta_mensagem('Repertório atualizado com sucesso.');
          this.closeEditModal();
          this.consultarRepertorioSistemaWeb();
        } else {
          console.warn('PATCH resposta:', resposta);
          this.apresenta_mensagem(`Falha ao atualizar: código ${resposta.status}`);
        }
      })
      .catch(async (erro: any) => {
        loading.dismiss();
        console.error('PATCH erro:', erro);
        const detalhe = erro?.message || (erro?.error ? JSON.stringify(erro.error) : null);
        this.apresenta_mensagem(`Erro ao atualizar repertório: ${detalhe || 'ver console'}`);
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

  // Receives duration in seconds or 'HH:MM:SS'/'MM:SS' string and formats to H:MM
  formatDuration(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '-';

    // If number => seconds
    if (typeof value === 'number') {
      const totalSeconds = Math.floor(value);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}` : `${minutes}:${(totalSeconds % 60).toString().padStart(2, '0')}`;
    }

    // If string contains ':' assume HH:MM:SS or MM:SS
    if (typeof value === 'string' && value.includes(':')) {
      const parts = value.split(':').map(p => parseInt(p, 10) || 0);
      if (parts.length === 3) {
        const [h, m, s] = parts;
        const minutesTotal = m + Math.floor(s / 60);
        return h > 0 ? `${h}:${minutesTotal.toString().padStart(2, '0')}` : `${minutesTotal}:${(s % 60).toString().padStart(2, '0')}`;
      } else if (parts.length === 2) {
        const [m, s] = parts;
        return `${m}:${s.toString().padStart(2, '0')}`;
      } else {
        return value;
      }
    }

    // Try ISO 8601 like PT1H30M
    if (typeof value === 'string' && value.startsWith('P') || value.startsWith('PT')) {
      try {
        const iso = value;
        const matchH = iso.match(/(\d+)H/);
        const matchM = iso.match(/(\d+)M/);
        const h = matchH ? parseInt(matchH[1], 10) : 0;
        const m = matchM ? parseInt(matchM[1], 10) : 0;
        return h > 0 ? `${h}:${m.toString().padStart(2, '0')}` : `${m}:00`;
      } catch (e) {
        return '-';
      }
    }

    // fallback: return as-is
    return String(value);
  }

}