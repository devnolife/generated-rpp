import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { LlmService, parseJsonLoose } from '../ai/llm.service';
import { resolveProfile } from '../ai/llm.config';
import { CreateRppInput } from './dto/create-rpp.input';
import { Rpp } from './models/rpp.model';
import { generateRppPrompt } from '../utils/rppPrompt';
import { SYSTEM_RPP_PROMPT } from './rpp.system-prompt';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

@Injectable()
export class RppService {
  private readonly logger = new Logger(RppService.name);

  constructor(private readonly llm: LlmService) { }

  getTokenUsage(): TokenUsage {
    return this.llm.getTokenUsage();
  }

  resetTokenUsage(): void {
    this.llm.resetTokenUsage();
  }

  async generateRpp(input: CreateRppInput): Promise<Rpp> {
    this.llm.resetTokenUsage();

    const profile = resolveProfile(input.ai_model ?? null);
    const userPrompt = generateRppPrompt(input);

    let rppData: any;
    try {
      const aiResponse = await this.llm.chat({
        profile,
        system: SYSTEM_RPP_PROMPT,
        prompt: userPrompt,
        json: true,
      });
      rppData = parseJsonLoose(aiResponse);
    } catch (error: any) {
      this.logger.error(`Gagal generate RPP: ${error?.message ?? error}`);
      throw new Error(`Terjadi kesalahan dalam pembuatan RPP: ${error?.message ?? error}`);
    }

    if (!rppData.materi_pembelajaran || !rppData.alur_kegiatan_pembelajaran) {
      this.logger.error(
        `Respons AI tidak lengkap. Keys: ${Object.keys(rppData ?? {}).join(', ')}`,
      );
      throw new Error('Respons AI tidak sesuai dengan format yang diharapkan');
    }

    const usage = this.llm.getTokenUsage();
    this.logger.log(
      `RPP generated [profile=${profile}] tokens prompt=${usage.promptTokens} completion=${usage.completionTokens} total=${usage.totalTokens}`,
    );

    const materi = normalizeMateri(rppData.materi_pembelajaran);
    const alur = normalizeAlur(rppData.alur_kegiatan_pembelajaran);
    const asesmen = normalizeAsesmen(rppData.asesmen_pembelajaran);
    const sumberMedia = normalizeSumberMedia(
      rppData.sumber_dan_media_pembelajaran,
    );
    const refleksi = normalizeRefleksi(rppData.refleksi_guru);

    return {
      id: uuidv4(),
      nama_penyusun: input.nama_penyusun || rppData.nama_penyusun || '',
      institusi: input.institusi || rppData.institusi || '',
      tahun_pembuatan: input.tahun_pembuatan || rppData.tahun_pembuatan || '',
      mata_pelajaran: input.mata_pelajaran || rppData.mata_pelajaran || '',
      jenjang: input.jenjang || rppData.jenjang || '',
      kelas: input.kelas || rppData.kelas || '',
      alokasi_waktu: input.alokasi_waktu || rppData.alokasi_waktu || '',
      tahapan: input.tahapan || rppData.tahapan || '',
      capaian_pembelajaran:
        input.capaian_pembelajaran || rppData.capaian_pembelajaran || '',
      domain_konten: input.domain_konten || rppData.domain_konten || '',
      tujuan_pembelajaran:
        input.tujuan_pembelajaran || rppData.tujuan_pembelajaran || '',
      konten_utama: input.konten_utama || rppData.konten_utama || '',
      prasyarat: input.prasyarat || rppData.prasyarat || '',
      pemahaman_bermakna:
        input.pemahaman_bermakna || rppData.pemahaman_bermakna || '',
      profil_pelajar: input.profil_pelajar || rppData.profil_pelajar || '',
      sarana: input.sarana || rppData.sarana || '',
      target_peserta: input.target_peserta || rppData.target_peserta || '',
      jumlah_peserta: input.jumlah_peserta || rppData.jumlah_peserta || '',
      model_pembelajaran:
        input.model_pembelajaran || rppData.model_pembelajaran || '',
      sumber_belajar: input.sumber_belajar || rppData.sumber_belajar || '',
      catatan: input.catatan || rppData.catatan || '',
      satuan_pendidikan: rppData.satuan_pendidikan || '',
      mataPelajaran: rppData.mata_pelajaran || input.mata_pelajaran || '',
      kelas_semester: rppData.kelas_semester || '',
      materi_pokok: rppData.materi_pokok || '',
      materi_pembelajaran: materi,
      tujuan_pembelajaran_list: ensureStringArr(rppData.tujuan_pembelajaran_list),
      profil_pelajar_pancasila: ensureStringArr(rppData.profil_pelajar_pancasila),
      alur_kegiatan_pembelajaran: alur,
      asesmen_pembelajaran: asesmen,
      sumber_dan_media_pembelajaran: sumberMedia,
      refleksi_guru: refleksi,
    };
  }
}

// ---------- Normalizers ----------
//
// LLM kadang mengembalikan shape yang sedikit berbeda (object vs array,
// string vs array of string). Helper berikut membuat output selalu cocok
// dengan schema GraphQL agar tidak meledakkan resolver Apollo.

function ensureStringArr(v: unknown): string[] {
  if (Array.isArray(v)) return v.map((x) => String(x ?? '')).filter(Boolean);
  if (typeof v === 'string' && v.trim()) {
    // pisah by newline/semicolon/bullet
    return v
      .split(/\r?\n|;|•/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function toKegiatanArr(
  v: unknown,
): Array<{ kegiatan: string; deskripsi: string }> {
  if (Array.isArray(v)) {
    return v.map((item) => {
      if (typeof item === 'string')
        return { kegiatan: item, deskripsi: item };
      const obj = (item ?? {}) as Record<string, any>;
      return {
        kegiatan: String(obj.kegiatan ?? obj.nama ?? obj.title ?? ''),
        deskripsi: String(obj.deskripsi ?? obj.description ?? obj.detail ?? ''),
      };
    });
  }
  if (v && typeof v === 'object') {
    const obj = v as Record<string, any>;
    if ('kegiatan' in obj || 'deskripsi' in obj) {
      return [
        {
          kegiatan: String(obj.kegiatan ?? ''),
          deskripsi: String(obj.deskripsi ?? ''),
        },
      ];
    }
    // mungkin shape: { langkah1: '...', langkah2: '...' }
    return Object.entries(obj).map(([k, val]) => ({
      kegiatan: k,
      deskripsi: typeof val === 'string' ? val : JSON.stringify(val),
    }));
  }
  if (typeof v === 'string' && v.trim()) {
    return [{ kegiatan: 'Kegiatan', deskripsi: v }];
  }
  return [];
}

function normalizeMateri(v: unknown) {
  const m = (v ?? {}) as Record<string, any>;
  return {
    pendahuluan: toKegiatanArr(m.pendahuluan),
    inti: toKegiatanArr(m.inti),
    penutup: toKegiatanArr(m.penutup),
  };
}

function toKegiatanDetail(v: unknown): { deskripsi: string; durasi: string } {
  if (typeof v === 'string') return { deskripsi: v, durasi: '' };
  const obj = (v ?? {}) as Record<string, any>;
  if (Array.isArray(v)) {
    return {
      deskripsi: v
        .map((x) =>
          typeof x === 'string' ? x : x?.deskripsi ?? JSON.stringify(x),
        )
        .join('; '),
      durasi: '',
    };
  }
  return {
    deskripsi: String(obj.deskripsi ?? obj.description ?? ''),
    durasi: String(obj.durasi ?? obj.duration ?? ''),
  };
}

function normalizeAlur(v: unknown) {
  const a = (v ?? {}) as Record<string, any>;
  return {
    pendahuluan: toKegiatanDetail(a.pendahuluan),
    inti: toKegiatanDetail(a.inti),
    penutup: toKegiatanDetail(a.penutup),
  };
}

function normalizeAsesmen(v: unknown) {
  const a = (v ?? {}) as Record<string, any>;
  return {
    diagnostik: String(a.diagnostik ?? a.diagnostic ?? ''),
    formatif: String(a.formatif ?? a.formative ?? ''),
    sumatif: String(a.sumatif ?? a.summative ?? ''),
  };
}

function normalizeSumberMedia(v: unknown) {
  const s = (v ?? {}) as Record<string, any>;
  return {
    buku: ensureStringArr(s.buku ?? s.books),
    media_digital: ensureStringArr(s.media_digital ?? s.digital ?? s.media),
    metode: ensureStringArr(s.metode ?? s.methods),
  };
}

function normalizeRefleksi(v: unknown) {
  const r = (v ?? {}) as Record<string, any>;
  return {
    pencapaian_tujuan: String(r.pencapaian_tujuan ?? r.pencapaian ?? ''),
    tantangan: String(r.tantangan ?? r.challenges ?? ''),
    strategi_perbaikan: String(
      r.strategi_perbaikan ?? r.strategi ?? r.improvement ?? '',
    ),
  };
}
