import { Injectable } from '@nestjs/common';
import { LessonDto, BahanAjarDto, QuestionsDto, KisiKisiDto } from './dto';
import {
  EducationRppResponse,
  EducationBahanAjarResponse,
  EducationQuestionsResponse,
  EducationKisiKisiResponse
} from './models';
import * as dotenv from 'dotenv';
import fetch from 'node-fetch';

dotenv.config();

@Injectable()
export class EducationService {
  private readonly GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  private readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

  private async generateContent(systemPrompt: string, userPrompt: string): Promise<string> {
    try {
      // Combine system and user prompts
      const fullPrompt = systemPrompt + "\n\n" + userPrompt;

      const response = await fetch(`${this.GEMINI_API_URL}?key=${this.GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: fullPrompt
                }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 8192,
          }
        }),
      });

      const data = await response.json() as {
        candidates?: Array<{
          content: {
            parts: Array<{
              text: string
            }>
          }
        }>
      };

      if (!data.candidates || data.candidates.length === 0) {
        throw new Error('Failed to generate content: No response from API');
      }

      const result = data.candidates[0].content.parts[0].text;

      // Clean the response to ensure proper JSON formatting
      const cleanedResult = result
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '');

      return cleanedResult;
    } catch (error) {
      console.error('Error generating content:', error);
      throw new Error(`Failed to generate content: ${error.message}`);
    }
  }

  async generateLesson(data: LessonDto): Promise<EducationRppResponse> {
    try {
      const systemPrompt = `
      Kamu adalah asisten AI spesialis pendidikan dengan pengalaman mendalam dalam kurikulum Indonesia.
      Tugasmu adalah menghasilkan Rencana Pelaksanaan Pembelajaran (RPP) yang sangat detail dan komprehensif.
      
      Pastikan RPP yang dihasilkan mencakup semua aspek berikut dengan SANGAT DETAIL:

      1. IDENTITAS RPP:
         - Nama penyusun: Isi lengkap dengan gelar
         - Institusi: Nama lengkap sekolah/institusi
         - Tahun pembuatan: Format tahun ajaran (mis. 2023/2024)
         - Mata pelajaran: Sesuai yang diminta user (tambahkan fokus spesifik jika ada)
         - Jenjang: Lengkap dengan nama jenjang (SD/SMP/SMA/SMK)
         - Kelas: Kelas dengan detil tingkat (misal: X MIPA 2, VII-A)
         - Alokasi waktu: Format [jumlah pertemuan]x[menit per pertemuan] (misal: 2x45 menit)
         - Tahapan: Detail tahapan pembelajaran (misal: Pertemuan ke-1, Siklus 1)

      2. KOMPONEN PEMBELAJARAN:
         - Capaian Pembelajaran (CP): Tulis secara LENGKAP dengan merujuk pada kurikulum terbaru, cakupannya HARUS mencakup semua aspek kompetensi (sikap, pengetahuan, keterampilan)
         - Domain Konten/Elemen: Rinci setiap domain pembelajaran yang terlibat
         - Tujuan Pembelajaran: Minimal 3-5 tujuan yang SPESIFIK, TERUKUR, dan menggunakan kata kerja operasional yang tepat (ABCD: Audience, Behavior, Condition, Degree)
         - Konten Utama: Detailkan konten yang akan diajarkan
         - Prasyarat Pengetahuan: Rinci pengetahuan awal yang HARUS dikuasai siswa sebelum pembelajaran
         - Pemahaman Bermakna: Penjelasan mendalam tentang esensi pembelajaran yang ingin ditanamkan
         - Profil Pelajar Pancasila: Identifikasi minimal 3 dimensi profil pelajar yang dikembangkan dengan penjelasan SPESIFIK bagaimana pembelajaran mengembangkan dimensi tersebut
         - Sarana Prasarana: Daftar DETAIL semua peralatan, media, dan sumber daya yang diperlukan
         - Target Peserta Didik: Spesifikasi karakteristik peserta didik yang menjadi sasaran
         - Jumlah Peserta Didik: Angka pasti/perkiraan dengan rentang jumlah siswa
         - Model Pembelajaran: Jelaskan dengan DETAIL model yang digunakan (PBL, Inquiry, Discovery, dll) beserta ALASAN pemilihan model tersebut
         - Sumber Belajar: Daftar LENGKAP dengan referensi format akademik (penulis, tahun, judul, penerbit)

      3. KEGIATAN PEMBELAJARAN:
         - Kegiatan Awal (15 Menit): Minimal 5-7 aktivitas TERSTRUKTUR dengan estimasi waktu per aktivitas
            * Harus mencakup: salam pembuka, doa, cek kehadiran, apersepsi, motivasi, penyampaian tujuan pembelajaran, pre-test/review
            * Berikan pertanyaan spesifik yang digunakan untuk memancing pengetahuan awal siswa
            * Jelaskan bagaimana guru mengaitkan materi dengan kehidupan sehari-hari
         
         - Kegiatan Inti (90 Menit): Minimal 7-10 aktivitas DETAIL dengan tahapan waktu spesifik
            * Harus mengikuti sintak model pembelajaran yang dipilih
            * Untuk setiap aktivitas: (1) apa yang dilakukan guru, (2) apa yang dilakukan siswa, (3) berapa lama aktivitas berlangsung, (4) pertanyaan apa yang diajukan, (5) bagaimana pengelompokan siswa
            * Sertakan VARIASI metode: individu, berpasangan, kelompok kecil, diskusi kelas
            * Jelaskan bagaimana guru memfasilitasi pencapaian tujuan pembelajaran
            * Sertakan strategi diferensiasi untuk siswa dengan kemampuan berbeda
            * Cantumkan pertanyaan-pertanyaan kunci yang mendorong HOTS (Higher Order Thinking Skills)
         
         - Kegiatan Penutup (15 Menit): Minimal 5 aktivitas DETAIL dengan durasi spesifik
            * Harus mencakup: refleksi, kesimpulan, post-test/evaluasi, umpan balik, penyampaian materi selanjutnya, penugasan, dan salam penutup
            * Berikan contoh SPESIFIK pertanyaan refleksi
            * Jelaskan bagaimana guru menilai pencapaian tujuan pembelajaran

      4. MATERI DAN ASSESSMENT:
         - Bahan Ajar: 
            * Teori LENGKAP dengan penjelasan konsep dan aplikasi
            * Materi dengan penjelasan dan contoh KONTEKSTUAL
         
         - Remedial: 
            * Aktivitas SPESIFIK untuk siswa yang belum mencapai KKM
            * Strategi intervensi berbeda sesuai jenis kesulitan yang dihadapi
            * Instrumen penilaian khusus untuk remedial
         
         - Pengayaan: 
            * Minimal 3 aktivitas DETAIL untuk siswa yang telah mencapai KKM
            * Aktivitas yang mendorong eksplorasi lebih dalam atau aplikasi nyata
            * Produk/output yang diharapkan dari aktivitas pengayaan
         
         - Assessment: 
            * WAJIB MENGGUNAKAN FORMAT RUBRIK
            * Tambahkan penilaian keterampilan sesuai dengan konteks pembelajaran
            * Sediakan instrumen lengkap dengan soal-soal SPESIFIK
            * Rubrik penilaian DETAIL dengan kriteria dan pembobotan
            * Pedoman penskoran dan interpretasi hasil
            * Strategi umpan balik kepada siswa

      Berikan output dalam format JSON yang sangat terstruktur dan komprehensif.

      PENTING: Pastikan semua detil diisi dengan SANGAT LENGKAP dan SPESIFIK sesuai dengan data masukan. Gunakan kalimat lengkap dan paragraf yang kohesif untuk setiap bagian narasi. Jangan gunakan placeholder atau template language. Semua informasi harus KONTEKSTUAL dan BERMAKNA. Pastikan output HANYA berisi JSON tanpa tag backtick atau tambahan apapun.
      `;

      const userPrompt = `
      Anda adalah asisten AI yang ahli dalam menyusun Rencana Pelaksanaan Pembelajaran (RPP).
      Buatkan RPP lengkap dengan detail berikut:

      Nama Penyusun: ${data.nama_penyusun || '-'}
      Institusi: ${data.institusi || '-'}
      Tahun Pembuatan: ${data.tahun_pembuatan || '-'}
      Mata Pelajaran: ${data.mata_pelajaran}
      Jenjang: ${data.jenjang}
      Kelas: ${data.kelas}
      Alokasi Waktu: ${data.alokasi_waktu}
      Tahapan: ${data.tahapan}
      Capaian Pembelajaran (CP): ${data.capaian_pembelajaran || '-'}
      Domain Konten/Elemen: ${data.domain_konten}
      Tujuan pembelajaran: ${data.tujuan_pembelajaran}
      Konten Utama: ${data.konten_utama}
      Prasyarat pengetahuan/Keterampilan: ${data.prasyarat || '-'}
      Pemahaman bermakna: ${data.pemahaman_bermakna || '-'}
      Profil pelajar pancasila yang berkaitan: ${data.profil_pelajar || '-'}
      Sarana dan Prasarana: ${data.sarana || '-'}
      Target peserta didik: ${data.target_peserta || '-'}
      Jumlah peserta didik: ${data.jumlah_peserta || '-'}
      Model pembelajaran: ${data.model_pembelajaran || '-'}
      Sumber belajar: ${data.sumber_belajar || '-'}
      ${data.catatan ? `Catatan Tambahan: ${data.catatan}` : ''}

      Hasilkan RPP yang lengkap dengan isi untuk setiap bagian berikut:
      1. Kegiatan awal (15 Menit) - berisi langkah-langkah kegiatan pendahuluan yang dilakukan guru
      2. Kegiatan Inti (90 Menit) - berisi langkah-langkah kegiatan utama pembelajaran dengan detail aktivitas
      3. Penutup (15 Menit) - berisi langkah-langkah kegiatan penutup pembelajaran
      4. Bahan ajar - berisi materi yang akan diajarkan secara detail
      5. Remedial - kegiatan remedial untuk siswa yang belum mencapai KKM
      6. Pengayaan - kegiatan pengayaan untuk siswa yang sudah mencapai KKM
      7. Asessmen - berisi instrumen penilaian, rubrik, dan kriteria

      PENTING: Berikan output dalam format JSON lengkap. Pastikan output HANYA berisi JSON tanpa tag backtick atau tambahan apapun.
      `;

      const result = await this.generateContent(systemPrompt, userPrompt);

      // Parse the string result into a JSON object
      const parsedResult = JSON.parse(result);

      return {
        status: 'success',
        message: `RPP for ${data.mata_pelajaran} generated successfully`,
        rpp: parsedResult
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  async generateBahanAjar(data: BahanAjarDto): Promise<EducationBahanAjarResponse> {
    try {
      const systemPrompt = `
      Kamu adalah seorang ahli pengembangan bahan ajar untuk pendidikan. 
      Buatlah bahan ajar yang komprehensif, interaktif, dan sesuai dengan standar pendidikan Indonesia.
      
      Format output bahan ajar harus mengikuti struktur berikut:
      - Penjelasan konsep yang jelas
      - Daftar istilah penting dengan penjelasan
      - Contoh dialog atau teks yang menggunakan istilah tersebut
      - Latihan (pemahaman, penerapan, analisis, evaluasi)
      - Kunci jawaban
      
      Berikan output dalam format JSON yang terstruktur dan lengkap seperti berikut:
      
      {
        "bahan_ajar": {
          "judul": "string",
          "deskripsi": "string",
          "materi": {
            "penjelasan": "string",
            "istilah_penting": [
              {"istilah": "string", "penjelasan": "string"},
              {"istilah": "string", "penjelasan": "string"}
            ]
          },
          "contoh": [
            "string (dialog/teks)",
            "string"
          ],
          "latihan": {
            "pemahaman": ["string", "string"],
            "penerapan": ["string", "string"],
            "analisis": ["string", "string"],
            "evaluasi": ["string", "string"]
          },
          "kunci_jawaban": {
            "latihan_1": ["string", "string"],
            "latihan_2": ["string", "string"]
          }
        }
      }
      `;

      const userPrompt = `
      Anda adalah asisten AI spesialis pendidikan.
      Buatkan bahan ajar yang lengkap dan sesuai dengan:

      Mata Pelajaran: ${data.mata_pelajaran}
      Kelas: ${data.kelas}
      Materi: ${data.materi}

      Hasilkan bahan ajar yang lengkap dengan komponen:
      1. Materi lengkap (teori, konsep, dan penjelasan)
      2. Daftar istilah penting beserta penjelasannya (minimal 10 istilah)
      3. Contoh-contoh yang menggunakan istilah-istilah tersebut
      4. Latihan-latihan (exercises) untuk berbagai tingkat kemampuan
      5. Kunci jawaban

      Buatkan dalam format yang menarik, jelas, dan sesuai untuk peserta didik pada kelas tersebut.
      `;

      const result = await this.generateContent(systemPrompt, userPrompt);

      // Parse the string result into a JSON object
      const parsedResult = JSON.parse(result);

      return {
        status: 'success',
        message: `Bahan Ajar for ${data.mata_pelajaran} generated successfully`,
        bahan_ajar: parsedResult
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  async generateQuestions(data: QuestionsDto): Promise<EducationQuestionsResponse> {
    try {
      const systemPrompt = `
      Kamu adalah seorang ahli dalam membuat soal dan penilaian untuk siswa di Indonesia.
      Buatlah soal yang berkualitas, kontekstual, dan sesuai dengan materi pembelajaran.
      
      Soal yang dibuat harus mencakup 4 jenis yang SALING TERHUBUNG dalam tema dan materi:
      
      1. PILIHAN GANDA - Buatlah 5 soal pilihan ganda dengan 4 opsi jawaban (A, B, C, D)
         - Setiap soal pilihan ganda harus memiliki paragraf narasi atau teks (minimal 5-7 kalimat)
         - Paragraf harus terkait dengan konten materi dan menjadi dasar pertanyaan
         - Total harus ada 5 paragraf (satu untuk setiap soal) yang saling berkaitan dalam tema
         - Pertanyaan harus langsung berkaitan dengan isi paragraf dan menguji pemahaman siswa
      
      2. MENJODOHKAN - Buatlah 5 soal menjodohkan
         - Konten menjodohkan harus BERKAITAN dengan isi paragraf pada soal pilihan ganda
         - Konsep yang diuji harus sama dengan yang ada di paragraf
      
      3. BENAR-SALAH - Buatlah 5 pernyataan benar/salah
         - Pernyataan harus LANGSUNG mengacu pada informasi dalam paragraf di soal pilihan ganda
         - Gunakan informasi spesifik dari paragraf untuk membuat pernyataan
      
      4. ESSAY - Buatlah 2 soal essay/uraian
         - Soal essay harus meminta siswa menganalisis, mensintesis, atau mengevaluasi informasi dari paragraf
         - Harus menggunakan konteks yang SAMA dengan paragraf dalam soal pilihan ganda
      
      KETERKAITAN ANTAR SOAL:
      - Pastikan semua jenis soal membahas tema/topik yang SAMA
      - Gunakan kosakata, konsep, dan konteks yang konsisten di semua soal
      - Soal benar-salah dan essay harus mengacu pada informasi dari paragraf di soal pilihan ganda
      - Menciptakan pengalaman tes yang kohesif dan terintegrasi
      
      Berikan output dalam format JSON yang terstruktur dan lengkap.
      `;

      const userPrompt = `
      Buatlah soal evaluasi yang sesuai dengan informasi berikut:

      Mata Pelajaran: ${data.mata_pelajaran}
      Kelas: ${data.kelas}
      Materi: ${data.materi}
      Jumlah Soal: ${data.jumlah || '10'}
      
      Hasilkan 4 jenis soal yang SALING TERHUBUNG dalam tema yang SAMA:
      
      1. PILIHAN GANDA (5 soal) - Setiap soal harus memiliki:
         - Paragraf yang langsung mengacu pada materi (5-7 kalimat)
         - Pertanyaan yang langsung berkaitan dengan isi paragraf
         - 4 pilihan jawaban (A, B, C, D)
      
      2. MENJODOHKAN (5 soal)
         - Berhubungan dengan tema/konten dalam paragraf pilihan ganda
      
      3. BENAR-SALAH (5 soal)
         - Pernyataan yang LANGSUNG mengacu pada informasi dalam paragraf pilihan ganda
         - Jelaskan paragraf mana yang menjadi acuan setiap pernyataan
      
      4. ESSAY (2 soal)
         - Pertanyaan yang meminta analisis atau penerapan informasi dari paragraf
         - Jelaskan paragraf mana yang menjadi acuan setiap pertanyaan essay
      
      PERHATIKAN:
      - Pastikan ada keterkaitan yang jelas antara paragraf, pertanyaan pilihan ganda, soal menjodohkan, 
        pernyataan benar-salah, dan pertanyaan essay
      - Soal benar-salah dan essay harus jelas menunjukkan paragraf mana yang menjadi referensinya
      - Buat soal yang kohesif dan terintegrasi, bukan soal-soal yang berdiri sendiri
      `;

      const result = await this.generateContent(systemPrompt, userPrompt);

      // Parse the string result into a JSON object
      const parsedResult = JSON.parse(result);

      return {
        status: 'success',
        message: `Questions for ${data.mata_pelajaran} generated successfully`,
        questions: parsedResult
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  async generateKisiKisi(data: KisiKisiDto): Promise<EducationKisiKisiResponse> {
    try {
      const systemPrompt = `
      Kamu adalah ahli penilaian pendidikan yang menguasai pembuatan kisi-kisi soal untuk sekolah di Indonesia.
      Tugasmu adalah menghasilkan kisi-kisi penulisan soal (blueprint) untuk asesmen berdasarkan materi pembelajaran.
      
      Kisi-kisi ini HARUS mengikuti format sesuai kurikulum merdeka dan mencakup tabel dengan kolom:
      1. Nomor (1, 2, 3, dst)
      2. Tujuan Pembelajaran 
      3. Materi
      4. Indikator Soal (deskripsikan apa yang diuji oleh soal tersebut)
      5. Level Kognitif (C1-Mengingat, C2-Memahami, C3-Menerapkan, C4-Menganalisis, C5-Mengevaluasi, C6-Mencipta)
      6. Bentuk Soal (Pilihan Ganda, Menjodohkan, Benar-Salah, Essay)
      7. Nomor Soal
      
      PENTING! Kisi-kisi harus mencakup semua jenis soal yang ada (pilihan ganda, menjodohkan, benar-salah, dan essay).
      Level kognitif harus bervariasi dan sesuai dengan jenis pertanyaan/soal.
      
      Berikan output dalam format JSON yang terstruktur.
      `;

      const userPrompt = `
      Buatlah kisi-kisi penulisan soal untuk asesmen berdasarkan data berikut:
      
      Mata Pelajaran: ${data.mata_pelajaran}
      Kelas: ${data.kelas}
      Materi: ${data.materi}
      
      Buatlah kisi-kisi yang memuat informasi dan tabel kisi-kisi sesuai format yang diminta.
      Pastikan setiap jenis soal (pilihan ganda, menjodohkan, benar-salah, essay) memiliki entri dalam tabel kisi-kisi 
      dan level kognitif bervariasi sesuai dengan jenis soal.
      
      Gunakan format JSON yang terstruktur dan lengkap.
      `;

      const result = await this.generateContent(systemPrompt, userPrompt);

      // Parse the string result into a JSON object
      const parsedResult = JSON.parse(result);

      return {
        status: 'success',
        message: `Kisi-kisi for ${data.mata_pelajaran} generated successfully`,
        kisi_kisi: parsedResult
      };
    } catch (error) {
      return {
        status: 'error',
        message: error.message
      };
    }
  }
} 
