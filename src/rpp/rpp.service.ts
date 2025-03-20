import { Injectable } from '@nestjs/common';
import { OpenAiService } from '../openai/openai.service';
import { CreateRppInput } from './dto/create-rpp.input';
import { Rpp } from './models/rpp.model';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RppService {
  constructor(private openAiService: OpenAiService) {}

  async generateRpp(input: CreateRppInput): Promise<Rpp> {
    try {
      const prompt = this.createRppPrompt(input);
      const openAiResponse = await this.openAiService.generateContent(prompt);

      if (!openAiResponse) {
        throw new Error('Gagal menerima respons dari OpenAI');
      }

      const rppData = this.parseOpenAiResponse(openAiResponse);

      if (!rppData.materi_pembelajaran || !rppData.alur_kegiatan_pembelajaran) {
        throw new Error('Respons OpenAI tidak sesuai dengan format yang diharapkan');
      }

      console.log('RPP data:', rppData);

      return {
        id: uuidv4(),
        ...input,
        ...rppData,
        createdAt: new Date(),
      };
    } catch (error) {
      console.error('Error generating RPP:', error);
      throw new Error('Terjadi kesalahan dalam pembuatan RPP');
    }
  }

  private createRppPrompt(input: CreateRppInput): string {
      //   Buatkan RPP (Rencana Pelaksanaan Pembelajaran) lengkap sesuai Kurikulum Merdeka dari Kemendikbud Indonesia dengan detail berikut:
  
      //   Satuan Pendidikan: ${input.satuanPendidikan}
      //   Mata Pelajaran: ${input.mataPelajaran}
      //   Topik: ${input.topik}
      //   Kelas: ${input.kelas}
      //   Jenjang Pendidikan: ${input.jenjangPendidikan}
      //   Fase: ${input.fase}
      //   Cakupan Materi: ${input.cakupanMateri}
      //   Alokasi Waktu: ${input.alokasi_waktu}
    return `
        Buatkan **Rencana Pelaksanaan Pembelajaran (RPP)** sesuai dengan **Kurikulum Merdeka** dari **Kemendikbud Indonesia** untuk **mata pelajaran ${input.mataPelajaran}**, kelas **${input.kelas}** SD, **Fase ${input.fase}**, dengan **topik "${input.topik}"** yang mencakup materi **(${input.cakupanMateri})**.  

        RPP ini harus mencakup seluruh komponen penting dan disusun dalam format JSON yang **terstruktur, detail, dan lengkap**.  


        ### **Komponen RPP yang Harus Dihasilkan dalam JSON:**  

        1. **Informasi Umum**  
        - Satuan Pendidikan, Mata Pelajaran, Kelas/Semester, Fase, Topik, Cakupan Materi, dan Alokasi Waktu.  

        2. **Tujuan Pembelajaran**  
        - Minimal **3 tujuan SMART** yang menggambarkan kompetensi yang diharapkan dari siswa.  

        3. **Profil Pelajar Pancasila**  
        - Pilih **beberapa profil** yang relevan dan jelaskan bagaimana diimplementasikan dalam pembelajaran.  

        4. **Materi Pembelajaran (Berisi Penjelasan Materi yang Akan Diajarkan)**  
        - **Pendahuluan:** Jelaskan secara rinci pengertian dasar dari **${input.topik}** berdasarkan sumber yang valid, contoh nyata, serta tujuan dari materi ini.  
        - **Inti:**  
            - **Penjelasan Konsep Utama:** Uraikan konsep utama dari **${input.topik}** dengan bahasa yang mudah dipahami oleh siswa SD.  
            - **Contoh Kasus dan Implementasi:** Berikan **contoh konkret dalam kehidupan sehari-hari** yang dapat membantu siswa memahami **${input.topik}** dengan lebih baik.  
            - **Latihan Soal atau Diskusi:** Tambahkan beberapa **pertanyaan, tugas diskusi, atau aktivitas berbasis proyek** yang relevan dengan **${input.topik}**.  
        - **Penutup:** Berikan **ringkasan pembelajaran** dengan kalimat yang **mendorong refleksi siswa**.  

        5. **Alur Kegiatan Pembelajaran**  
        - Pendahuluan (10-15 menit), Inti (60-80 menit), Penutup (10-15 menit).  

        6. **Asesmen Pembelajaran**  
        - Diagnostik, Formatif, dan Sumatif.  

        7. **Sumber dan Media Pembelajaran**  
        - Buku, media digital, dan metode pengajaran.  

        8. **Refleksi Guru**  
        - Panduan refleksi setelah pembelajaran.  

        ### **Format JSON yang Diharapkan:**  

        {
            "satuan_pendidikan": "${input.satuanPendidikan}",
            "mata_pelajaran": "${input.mataPelajaran}",
            "kelas_semester": "${input.kelas}",
            "fase": "${input.fase}",
            "alokasi_waktu": "${input.alokasi_waktu}",
            "materi_pokok": "${input.topik}",
            "materi_pembelajaran": {
              "pendahuluan": [
                {
                  "kegiatan": "Guru menyapa siswa dan memeriksa kehadiran.",
                  "deskripsi": "Memberikan salam, mengecek kehadiran, dan membangun suasana belajar yang nyaman."
                },
                {
                  "kegiatan": "Apersepsi",
                  "deskripsi": "Mengaitkan materi sebelumnya dengan materi yang akan dipelajari, serta memancing rasa ingin tahu siswa melalui pertanyaan atau media visual."
                },
                {
                  "kegiatan": "Penyampaian Tujuan Pembelajaran",
                  "deskripsi": "Guru menyampaikan tujuan pembelajaran yang diharapkan serta menjelaskan manfaat materi dalam kehidupan sehari-hari."
                }
              ],
              "inti": [
                {
                  "kegiatan": "Penyampaian Materi",
                  "deskripsi": "Guru menjelaskan materi dengan metode yang sesuai, seperti ceramah, diskusi, atau praktik.",
                  "metode": "Disesuaikan dengan input materi pengguna."
                },
                {
                  "kegiatan": "Diskusi atau Tanya Jawab",
                  "deskripsi": "Siswa diajak untuk berdiskusi atau mengajukan pertanyaan untuk memperdalam pemahaman.",
                  "metode": "Berdasarkan kompleksitas materi yang diinput."
                },
                {
                  "kegiatan": "Praktik atau Latihan",
                  "deskripsi": "Siswa mengerjakan tugas atau latihan sebagai bentuk penerapan konsep.",
                  "metode": "Bisa berupa studi kasus, eksperimen, atau soal latihan."
                }
              ],
              "penutup": [
                {
                  "kegiatan": "Refleksi",
                  "deskripsi": "Guru mengajak siswa merefleksikan pembelajaran hari ini dan menyimpulkan poin penting dari materi."
                },
                {
                  "kegiatan": "Evaluasi",
                  "deskripsi": "Memberikan pertanyaan singkat atau kuis untuk mengukur pemahaman siswa."
                },
                {
                  "kegiatan": "Memberikan Tugas",
                  "deskripsi": "Jika diperlukan, guru memberikan tugas rumah yang relevan dengan materi."
                }
              ]
            },
            "tujuan_pembelajaran": [
                "Murid mampu memahami dan menjelaskan konsep ${input.cakupanMateri}.",
                "Murid dapat mengaplikasikan konsep ${input.topik} dalam kehidupan sehari-hari.",
                "Murid menunjukkan pemecahan masalah melalui latihan atau proyek berbasis masalah."
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
                    "durasi": "10-15 menit"
                },
                "inti": {
                    "deskripsi": "Aktivitas eksplorasi, diskusi, eksperimen, proyek berbasis pembelajaran aktif terkait ${input.topik}.",
                    "durasi": "60-80 menit"
                },
                "penutup": {
                    "deskripsi": "Refleksi, evaluasi, dan tindak lanjut.",
                    "durasi": "10-15 menit"
                }
            },
            "asesmen_pembelajaran": {
                "diagnostik": "Sebelum pembelajaran – untuk mengetahui kesiapan peserta didik terkait ${input.topik}.",
                "formatif": "Selama proses pembelajaran – observasi, diskusi, latihan soal tentang ${input.topik}.",
                "sumatif": "Setelah pembelajaran – kuis, proyek, atau presentasi terkait ${input.topik}."
            },
            "sumber_dan_media_pembelajaran": {
                "buku": ["Buku teks terkait ${input.mataPelajaran}", "Modul pembelajaran"],
                "media_digital": ["Video pembelajaran", "Simulasi interaktif"],
                "metode": ["Ceramah", "Diskusi", "Proyek", "Eksperimen"]
            },
            "refleksi_guru": {
                "pencapaian_tujuan": "Apakah tujuan pembelajaran tercapai?",
                "tantangan": "Apa tantangan yang dihadapi dalam mengajarkan ${input.topik}?",
                "strategi_perbaikan": "Bagaimana strategi perbaikan dalam sesi pembelajaran berikutnya?"
            }
        }

        Isi dari RPP ini harus dihasilkan dalam format JSON yang terstruktur dan detail. Pastikan untuk menyertakan informasi yang relevan dan sesuai dengan Kurikulum Merdeka dari Kemendikbud Indonesia.
        Tiap komponen RPP harus dijelaskan dengan lengkap dan jelas sesuai dengan topik dan cakupan materi yang telah ditentukan.
        `
  }

  private parseOpenAiResponse(response: string): any {
    try {
      // Cari bagian JSON dalam respons
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch && jsonMatch[0]) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Tidak ditemukan format JSON dalam respons');
    } catch (error) {
      console.error('Error parsing OpenAI response:', error);
      throw new Error('Format JSON tidak valid dalam respons dari OpenAI');
    }
  }
}
