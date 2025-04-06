import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../ai/openai.service';
import { AiModel, CreateRppInput } from './dto/create-rpp.input';
import { Rpp } from './models/rpp.model';
import { v4 as uuidv4 } from 'uuid';
import { GeminiService } from 'src/ai/gemini.service';
import { generateRppPrompt } from 'src/utils/rppPrompt';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

@Injectable()
export class RppService {
  private tokenUsage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
  
  constructor(
    private openAiService: OpenAiService,
    private geminiAiService: GeminiService
  ) {}

  getTokenUsage(): TokenUsage {
    return { ...this.tokenUsage };
  }

  resetTokenUsage(): void {
    this.tokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    this.openAiService.resetTokenUsage();
    this.geminiAiService.resetTokenUsage();
  }

  async generateRpp(input: CreateRppInput): Promise<Rpp> {
    try {
      // Reset token usage before each generation
      this.resetTokenUsage();
      
      const prompt = this.createRppPrompt(input);
      let aiResponse: string;
      let modelUsed: string;
      
      // Use the selected AI model
      if (input.ai_model === AiModel.OPENAI || input.ai_model === AiModel.SweetV1) {
        // OpenAI models
        aiResponse = await this.openAiService.generateContent(prompt);
        this.tokenUsage = this.openAiService.getTokenUsage();
        modelUsed = 'OpenAI';
      } else if (input.ai_model === AiModel.EmiliaAiV2) {
        // Gemini V2
        aiResponse = await this.geminiAiService.GuruPintarV2(prompt);
        this.tokenUsage = this.geminiAiService.getTokenUsage();
        modelUsed = 'Gemini V2';
      } else if (input.ai_model === AiModel.EmiliaAiV3) {
        // Gemini V3
        aiResponse = await this.geminiAiService.GuruPintarV3(prompt);
        this.tokenUsage = this.geminiAiService.getTokenUsage();
        modelUsed = 'Gemini V3';
      } else {
        // Default to Gemini V1 (including AiModel.GEMINI and AiModel.EmiliaAiV1)
        aiResponse = await this.geminiAiService.GuruPintarV1(prompt);
        this.tokenUsage = this.geminiAiService.getTokenUsage();
        modelUsed = 'Gemini V1';
      }

      if (!aiResponse) {
        throw new Error('Gagal menerima respons dari AI model');
      }

      const rppData = this.parseOpenAiResponse(aiResponse);

      if (!rppData.materi_pembelajaran || !rppData.alur_kegiatan_pembelajaran) {
        throw new Error('Respons AI tidak sesuai dengan format yang diharapkan');
      }

      // Log the token usage
      console.log(`==== ${modelUsed} Token Usage ====`);
      console.log(`Prompt Tokens: ${this.tokenUsage.promptTokens}`);
      console.log(`Completion Tokens: ${this.tokenUsage.completionTokens}`);
      console.log(`Total Tokens: ${this.tokenUsage.totalTokens}`);
      console.log('========================');

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
        capaian_pembelajaran: input.capaian_pembelajaran || rppData.capaian_pembelajaran || '',
        domain_konten: input.domain_konten || rppData.domain_konten || '',
        tujuan_pembelajaran: input.tujuan_pembelajaran || rppData.tujuan_pembelajaran || '',
        konten_utama: input.konten_utama || rppData.konten_utama || '',
        prasyarat: input.prasyarat || rppData.prasyarat || '',
        pemahaman_bermakna: input.pemahaman_bermakna || rppData.pemahaman_bermakna || '',
        profil_pelajar: input.profil_pelajar || rppData.profil_pelajar || '',
        sarana: input.sarana || rppData.sarana || '',
        target_peserta: input.target_peserta || rppData.target_peserta || '',
        jumlah_peserta: input.jumlah_peserta || rppData.jumlah_peserta || '',
        model_pembelajaran: input.model_pembelajaran || rppData.model_pembelajaran || '',
        sumber_belajar: input.sumber_belajar || rppData.sumber_belajar || '',
        catatan: input.catatan || rppData.catatan || '',
        satuan_pendidikan: rppData.satuan_pendidikan || '',
        mataPelajaran: rppData.mata_pelajaran || input.mata_pelajaran || '',
        kelas_semester: rppData.kelas_semester || '',
        materi_pokok: rppData.materi_pokok || '',
        materi_pembelajaran: rppData.materi_pembelajaran,
        tujuan_pembelajaran_list: rppData.tujuan_pembelajaran_list || [],
        profil_pelajar_pancasila: rppData.profil_pelajar_pancasila || [],
        alur_kegiatan_pembelajaran: rppData.alur_kegiatan_pembelajaran,
        asesmen_pembelajaran: rppData.asesmen_pembelajaran,
        sumber_dan_media_pembelajaran: rppData.sumber_dan_media_pembelajaran,
        refleksi_guru: rppData.refleksi_guru,
      };
    } catch (error) {
      console.error('Error generating RPP:', error);
      throw new Error('Terjadi kesalahan dalam pembuatan RPP');
    }
  }

  private createRppPrompt(input: CreateRppInput): string {
    return generateRppPrompt(input);
  }

  private parseOpenAiResponse(response: string): any {
    try {
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch && jsonMatch[0]) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Tidak ditemukan format JSON dalam respons');
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Format JSON tidak valid dalam respons dari AI');
    }
  }
}
