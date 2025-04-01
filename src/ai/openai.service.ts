import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

@Injectable()
export class OpenAiService {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.get<string>('GEMINI_API_KEY'),
    });
  }

  async generateContent(prompt: string): Promise<string> {
    try {
      const systemPrompt = `
        Anda adalah seorang tenaga ahli dalam bidang pedidikan. Saat ini anda telah di berikan tanggung jawab resmi dari Kementerian Pendidikan dan Kebudayaan Republik Indonesia untuk membuat RPP (Rencana Pelaksanaan Pembelajaran) lengkap sesuai Kurikulum Merdeka.

        Buat RPP dengan baik dan benar sesuai dengan standar yang berlaku, Gunakan bahasa yang jelas dan jangan memberikan informasi atau response seperti ensiklopedia. Berikan response yang natural dan inovatif sesuai dengan kebutuhan.
        
        Berikut adalah detail yang harus anda masukkan dalam RPP:

        {
          "satuan_pendidikan": "[Nama Sekolah]",
          "mata_pelajaran": "[Nama Mata Pelajaran]",
          "kelas_semester": "[Kelas & Semester]",
          "alokasi_waktu": "[Jumlah Jam Pelajaran]",
          "materi_pokok": "[Judul Materi]",
          "materi_pembelajaran": {
            "pendahuluan": "Pengenalan konsep dasar tentang ...",
            "inti": [
              "Penjelasan konsep ...",
              "Contoh kasus ...",
              "Latihan soal atau diskusi ..."
            ],
            "penutup": "Ringkasan materi dan refleksi pemahaman."
          },
          "tujuan_pembelajaran": [
            "Peserta didik mampu ...",
            "Peserta didik dapat ...",
            "Peserta didik memahami ..."
          ],
          "profil_pelajar_pancasila": [
            "Beriman, Bertakwa kepada Tuhan Yang Maha Esa, dan Berakhlak Mulia",
            "Berkebinekaan Global",
            "Bergotong-royong",
            "Mandiri",
            "Bernalar Kritis",
            "Kreatif"
          ],
          "alur_kegiatan_pembelajaran": {
            "pendahuluan": {
              "deskripsi": "Kegiatan apersepsi, motivasi, dan penyampaian tujuan pembelajaran.",
              "durasi": "[Menit]"
            },
            "inti": {
              "deskripsi": "Aktivitas eksplorasi, diskusi, eksperimen, proyek berbasis pembelajaran aktif.",
              "durasi": "[Menit]"
            },
            "penutup": {
              "deskripsi": "Refleksi, evaluasi, dan tindak lanjut.",
              "durasi": "[Menit]"
            }
          },
          "asesmen_pembelajaran": {
            "diagnostik": "Sebelum pembelajaran – untuk mengetahui kesiapan peserta didik.",
            "formatif": "Selama proses pembelajaran – observasi, diskusi, latihan soal.",
            "sumatif": "Setelah pembelajaran – kuis, proyek, presentasi."
          },
          "sumber_dan_media_pembelajaran": {
            "buku": "[Referensi Buku atau Modul]",
            "media_digital": "[Video, simulasi, aplikasi interaktif, dll.]",
            "metode": "[Ceramah, diskusi, proyek, eksperimen, dll.]"
          },
          "refleksi_guru": {
            "pencapaian_tujuan": "Apakah tujuan pembelajaran tercapai?",
            "tantangan": "Apa tantangan yang dihadapi?",
            "strategi_perbaikan": "Bagaimana strategi perbaikan ke depan?"
          }
        }
      `
      const response = await this.openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: 'system', content: systemPrompt },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000,
      });

      return response.choices[0].message.content || 'Tidak ada konten yang dihasilkan';
    } catch (error) {
      console.error('Error calling OpenAI API:', error);
      throw new Error('Gagal menghasilkan konten dari OpenAI');
    }
  }
}
