import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { 
  IonContent, IonHeader, IonTitle, IonToolbar, 
  LoadingController, NavController, ToastController, 
  IonButtons, IonMenuButton, IonText, IonCard, 
  IonCardHeader, IonCardTitle, IonCardSubtitle, 
  IonCardContent, IonList, IonItem, IonItemSliding, 
  IonThumbnail, IonLabel, IonItemOptions, IonItemOption,
  IonIcon, IonButton, IonModal, IonInput, IonSelect, IonSelectOption, IonTextarea
} from '@ionic/angular/standalone';
import { Storage } from '@ionic/storage-angular';
import { Repertorio } from './repertorio.model';
import { Usuario } from '../login/usuario.model';
import { CapacitorHttp, HttpOptions, HttpResponse } from '@capacitor/core';
import { addIcons } from 'ionicons';
import { logOutOutline, createOutline, trashOutline } from 'ionicons/icons';
import { IonSearchbar } from '@ionic/angular';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule
  ],
  providers: [Storage]
})
export class HomePage implements OnInit {
  public usuario: Usuario = new Usuario();
  public searchQuery: string = '';
  @ViewChild('searchbar', { static: false }) searchbar?: IonSearchbar;
  public lista_repertorio: any[] = [];
  public editing: boolean = false;
  public editModel: any = {};
  public showDuracao = true;
  public showTemporada = false;

  constructor(
    public storage: Storage,
    public controle_toast: ToastController,
    public controle_navegacao: NavController,
    public controle_carregamento: LoadingController,
    private cd: ChangeDetectorRef
  ) { }

  get userDisplay(): string {
    const u: any = this.usuario as any;
    return (u && (u.nome || u.usuario || u.username)) ? (u.nome || u.usuario || u.username) : '';
  }

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

  async consultarRepertorioSistemaWeb(q?: string | null) {
    const candidate = (q !== undefined && q !== null) ? q : this.searchQuery;
    const termo = (typeof candidate === 'string') ? candidate.trim() : '';

    const loading = await this.controle_carregamento.create({ message: termo ? 'Pesquisando...' : 'Carregando...', duration: 60000 });
    await loading.present();

    const baseUrl = 'http://127.0.0.1:8000/repertorio/api/';
    const url = termo ? `${baseUrl}?q=${encodeURIComponent(termo)}` : baseUrl;

    const headers: any = { 'Content-Type': 'application/json' };
    if (this.usuario && (this.usuario as any).token) {
      headers['Authorization'] = `Token ${(this.usuario as any).token}`;
    }
    const options: HttpOptions = { headers, url };

    CapacitorHttp.get(options)
      .then(async (resposta: HttpResponse) => {
        if (resposta.status == 200) {
          try {
            const raw = resposta.data as any[];
            this.lista_repertorio = Array.isArray(raw) ? raw.map(r => new Repertorio(r)) : [];
          } catch (e) {
            this.lista_repertorio = [];
          }
          loading.dismiss();
        } else {
          loading.dismiss();
          this.apresenta_mensagem(`Falha ao consultar repertórios: código ${resposta.status}`);
        }
      })
      .catch(async (erro: any) => {
        console.error(erro);
        loading.dismiss();
        this.lista_repertorio = [];
        this.apresenta_mensagem(`Falha ao consultar repertórios: código ${erro?.status ?? 'erro'}`);
      });
  }

  async excluirRepertorio(id: number) {

    const loading = await this.controle_carregamento.create({message: 'Excluindo...', duration: 30000});
    await loading.present();

    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': `Token ${this.usuario.token}`
    };
    const options: HttpOptions = {
      headers,
      url: `http://127.0.0.1:8000/repertorio/api/deletar/${id}/`
    };

    CapacitorHttp.delete(options)
      .then(async (resposta: HttpResponse) => {

        if(resposta.status == 204) {
          
          loading.dismiss();
        }
        else {

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

        this.lista_repertorio = [];
        this.consultarRepertorioSistemaWeb();
      });
  }

  async editarRepertorio(id: number, item?: any) {
    try {
      const novoNome = window.prompt('Editar nome do repertório (deixe em branco para não alterar):', item?.nome || '');
      if (novoNome === null) return;

      const novaResenha = window.prompt('Editar resenha (deixe em branco para não alterar):', item?.resenha || '');
      if (novaResenha === null) return; 

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

    } catch (e) {
      console.error('editarRepertorio error', e);
    }
  }

  openEditModal(item: any) {
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

    const payload: any = {
      nome: (this.editModel.nome || '').trim(),
      tipo: this.editModel.tipo || null,
      estrela: this.editModel.estrela ?? null,
      duracao: (this.editModel.duracao || null),
      temporada: (this.editModel.temporada !== undefined ? this.editModel.temporada : null),
      resenha: (this.editModel.resenha || '').trim()
    };

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
    try {
      await this.storage.clear();
    } catch (e) {
      console.warn('Erro ao limpar storage durante logout', e);
    }
    this.controle_navegacao.navigateRoot('/login');
  }

clearSearch(): void {
    this.searchQuery = '';
    setTimeout(() => {
      try { this.searchbar && (this.searchbar.value = ''); } catch { /* ignore */ }
      this.consultarRepertorioSistemaWeb('');
      this.cd.detectChanges();
    }, 0);
  }


  formatDuration(value: number | string | null | undefined): string {
    if (value === null || value === undefined || value === '') return '-';

    if (typeof value === 'number') {
      const totalSeconds = Math.floor(value);
      const hours = Math.floor(totalSeconds / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      return hours > 0 ? `${hours}:${minutes.toString().padStart(2, '0')}` : `${minutes}:${(totalSeconds % 60).toString().padStart(2, '0')}`;
    }

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

    return String(value);
  }

  getFotoUrl(item: any): string | null {
    if (!item) return null;
    if (typeof item.getFotoUrl === 'function') {
      try { return item.getFotoUrl(); } catch { /* ignore */ }
    }
    if (typeof item.foto === 'string' && item.foto.trim().length > 0) {
      if (item.foto.startsWith('http')) return item.foto;
      return `http://127.0.0.1:8000/${item.foto.replace(/^\/+/, '')}`;
    }
    if (typeof item.foto_url === 'string' && item.foto_url.trim().length > 0) return item.foto_url;
    return null;
  }

}