export class Repertorio {
    public id: number;
    public nome: string;
    public data: string | Date;
    public estrela: number;
    public resenha: string;
    public tipo: string;
    public duracao: string | number | null;
    public temporada: number | null;
    public foto?: string | null;

    constructor(init?: Partial<Repertorio>) {
        this.id = init?.id ?? 0;
        this.nome = init?.nome ?? '';
        this.data = init?.data ?? new Date().toISOString().slice(0, 10);
        this.estrela = init?.estrela ?? 0;
        this.resenha = init?.resenha ?? '';
        this.tipo = init?.tipo ?? 'FILME';
        this.duracao = init?.duracao ?? null;
        this.temporada = init?.temporada ?? null;
        this.foto = init?.foto ?? null;
    }

    public get repertorio_ano(): boolean {
        let year: number;
        if (!this.data) return false;
        if (typeof this.data === 'string') {
            const d = new Date(this.data);
            if (isNaN(d.getTime())) return false;
            year = d.getFullYear();
        } else {
            year = this.data.getFullYear();
        }
        return year === new Date().getFullYear();
    }

    public durationSeconds(): number | null {
        if (this.duracao == null) return null;
        if (typeof this.duracao === 'number') return this.duracao;
        const parts = this.duracao.split(':').map(p => parseInt(p, 10));
        if (parts.some(isNaN)) return null;
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 1) return parts[0];
        return null;
    }

    public getFotoUrl(): string | null {
        if (!this.foto) return null;
        const anyFoto: any = this.foto;
        if (typeof anyFoto === 'string') return anyFoto as string;
        if (anyFoto && typeof anyFoto === 'object') {
            return anyFoto.url || anyFoto.pk || null;
        }
        return null;
    }

    public get get_tipo_display(): string | null {
        const map: Record<string, string> = {
            'FILME': 'Filme',
            'SERIE': 'Série',
            'OUTRO': 'Outro'
        };
        return map[this.tipo] ?? null;
    }

    public get get_estrela_display(): string | null {
        if (this.estrela == null) return null;
        return String(this.estrela);
    }
}