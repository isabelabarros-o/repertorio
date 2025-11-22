export class Repertorio {
    public id: number;
    public nome: string;
    // ISO date string (e.g. '2025-11-22') or Date
    public data: string | Date;
    // estrela is stored as a small integer in Django
    public estrela: number;
    public resenha: string;
    // 'FILME' | 'SERIE' | 'OUTRO'
    public tipo: string;
    // Duration in ISO 8601 or as seconds; Django uses DurationField.
    // We'll represent it as string (e.g. '01:45:00') or number (seconds) or null
    public duracao: string | number | null;
    // temporada only for series
    public temporada: number | null;
    // foto may be a relative URL string or an object; keep as optional string
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

    // Helper property to check if `data` is in the current year, similar to Django property
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

    // Optional: convert duration (string 'HH:MM:SS' or seconds) to seconds
    public durationSeconds(): number | null {
        if (this.duracao == null) return null;
        if (typeof this.duracao === 'number') return this.duracao;
        // expect 'HH:MM:SS' or 'MM:SS'
        const parts = this.duracao.split(':').map(p => parseInt(p, 10));
        if (parts.some(isNaN)) return null;
        if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
        if (parts.length === 2) return parts[0] * 60 + parts[1];
        if (parts.length === 1) return parts[0];
        return null;
    }

    // Returns a usable photo URL string when `foto` can be a string or an object
    public getFotoUrl(): string | null {
        if (!this.foto) return null;
        // If API returned an object (e.g. { url: '...' }) handle it
        const anyFoto: any = this.foto;
        if (typeof anyFoto === 'string') return anyFoto as string;
        if (anyFoto && typeof anyFoto === 'object') {
            return anyFoto.url || anyFoto.pk || null;
        }
        return null;
    }

    // Getter to mimic Django's get_tipo_display (returns human readable type)
    public get get_tipo_display(): string | null {
        const map: Record<string, string> = {
            'FILME': 'Filme',
            'SERIE': 'Série',
            'OUTRO': 'Outro'
        };
        return map[this.tipo] ?? null;
    }

    // Getter to mimic Django's get_estrela_display (returns a display for estrela)
    public get get_estrela_display(): string | null {
        if (this.estrela == null) return null;
        // Simple representation: number -> same number, or you may map to stars
        return String(this.estrela);
    }
}