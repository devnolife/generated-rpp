import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnglishLessonDto, BahanAjarDto, QuestionsDto, KisiKisiDto } from './dto';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class EnglishService {
  private readonly logger = new Logger(EnglishService.name);
  private genAI: GoogleGenerativeAI;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /**
   * Generate English lesson RPP based on input data
   */
  async generateEnglishLesson(data: EnglishLessonDto): Promise<any> {
    const systemPrompt = `
    Kamu adalah asisten AI spesialis pendidikan bahasa Inggris dengan pengalaman mendalam dalam kurikulum Indonesia.
    Tugasmu adalah menghasilkan Rencana Pelaksanaan Pembelajaran (RPP) bahasa Inggris yang sangat detail dan komprehensif.
    
    Pastikan RPP yang dihasilkan mencakup semua aspek berikut dengan SANGAT DETAIL:

    1. IDENTITAS RPP:
       - Nama penyusun: Isi lengkap dengan gelar
       - Institusi: Nama lengkap sekolah/institusi
       - Tahun pembuatan: Format tahun ajaran (mis. 2023/2024)
       - Mata pelajaran: Bahasa Inggris (tambahkan fokus spesifik jika ada)
       - Jenjang: Lengkap dengan nama jenjang (SD/SMP/SMA/SMK)
       - Kelas: Kelas dengan detil tingkat (misal: X MIPA 2, VII-A)
       - Alokasi waktu: Format [jumlah pertemuan]x[menit per pertemuan] (misal: 2x45 menit)
       - Tahapan: Detail tahapan pembelajaran (misal: Pertemuan ke-1, Siklus 1)

    2. KOMPONEN PEMBELAJARAN:
       - Capaian Pembelajaran (CP): Tulis secara LENGKAP dengan merujuk pada kurikulum terbaru, cakupannya HARUS mencakup semua aspek kompetensi (sikap, pengetahuan, keterampilan)
       - Domain Konten/Elemen: Rinci setiap domain pembelajaran bahasa Inggris yang terlibat (listening, speaking, reading, writing dan bagaimana proporsinya)
       - Tujuan Pembelajaran: Minimal 3-5 tujuan yang SPESIFIK, TERUKUR, dan menggunakan kata kerja operasional yang tepat (ABCD: Audience, Behavior, Condition, Degree)
       - Konten Utama: Detailkan konten linguistik (grammar, vocabulary) dan konten tematik yang akan diajarkan
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
          * Materi linguistik (grammar, vocabulary) dengan penjelasan dan contoh KONTEKSTUAL
          * Teks/dialog lengkap yang akan digunakan (minimal 250-300 kata)
          * Materi visual (deskripsi detail gambar/grafik/bagan yang digunakan)
       
       - Remedial: 
          * Aktivitas SPESIFIK untuk siswa yang belum mencapai KKM
          * Strategi intervensi berbeda sesuai jenis kesulitan yang dihadapi
          * Instrumen penilaian khusus untuk remedial
       
       - Pengayaan: 
          * Minimal 3 aktivitas DETAIL untuk siswa yang telah mencapai KKM
          * Aktivitas yang mendorong eksplorasi lebih dalam atau aplikasi nyata
          * Produk/output yang diharapkan dari aktivitas pengayaan
       
       - Assessment: 
          * WAJIB MENGGUNAKAN FORMAT RUBRIK BERIKUT:
          
          1. Rubrik penilaian pengetahuan
             a. Teknik penilaian: Tes tertulis
             b. Bentuk Instrumen: Menyebutkan macam-macam profesi dalam Bahasa Inggris
             c. Kisi-kisi: Mengamati gambar yang ada di buku siswa halaman 11.
             d. Instrumen penilaian: (Sertakan minimal 5 soal)
          
          2. Rubrik untuk penilaian keterampilan mengucapkan
             Gunakan tabel dengan format:
             
             | No | Aspek | Deskripsi | Skor |
             |----|-------|-----------|------|
             | 1 | Pengucapan | 1. Sempurna | 5 |
             |   |           | 2. Ada kesalahan tapi tidak mengganggu makna | 4 |
             |   |           | 3. Ada beberapa kesalahan dan mengganggu makna | 3 |
             |   |           | 4. Banyak kesalahan dan mengganggu makna | 2 |
             |   |           | 5. Terlalu banyak kesalahan sehingga sulit untuk dipahami | 1 |
             | 2 | Pilihan Kata | a. Sangat variatif dan tepat | 5 |
             |   |              | b. Variatif dan tepat | 4 |
             |   |              | c. Cukup variatif dan tepat | 3 |
             |   |              | d. Kurang variatif dan tepat | 2 |
             |   |              | e. Tidak variatif dan tepat | 1 |
             
             Penentuan Nilai: nilaiSiswa = skorDiperoleh/skorMaksimal * 100
          
          * Tambahkan juga penilaian keterampilan lain sesuai dengan konteks pembelajaran (reading, writing, listening) dengan format yang serupa
          * Sediakan instrumen lengkap dengan soal-soal SPESIFIK (minimal 5 soal per jenis)
          * Rubrik penilaian DETAIL dengan kriteria dan pembobotan
          * Pedoman penskoran dan interpretasi hasil
          * Strategi umpan balik kepada siswa

    Berikan output dalam format JSON yang sangat terstruktur dan komprehensif.
    `;

    const userPrompt = `
    Anda adalah asisten AI yang ahli dalam menyusun Rencana Pelaksanaan Pembelajaran (RPP) untuk mata pelajaran Bahasa Inggris.
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
    ${data.catatan ? `Catatan Tambahan: ${data.catatan}` : ""}

    Hasilkan RPP Bahasa Inggris yang lengkap dengan isi untuk setiap bagian berikut:
    1. Kegiatan awal (15 Menit) - berisi langkah-langkah kegiatan pendahuluan yang dilakukan guru
    2. Kegiatan Inti (90 Menit) - berisi langkah-langkah kegiatan utama pembelajaran dengan detail aktivitas
    3. Penutup (15 Menit) - berisi langkah-langkah kegiatan penutup pembelajaran
    4. Bahan ajar - berisi materi yang akan diajarkan secara detail
    5. Remedial - kegiatan remedial untuk siswa yang belum mencapai KKM
    6. Pengayaan - kegiatan pengayaan untuk siswa yang sudah mencapai KKM
    7. Asessmen - berisi instrumen penilaian, rubrik, dan kriteria

    PENTING: Berikan output dalam format JSON lengkap.
    `;

    try {
      // Generate content with Gemini
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent([systemPrompt, userPrompt]);
      const response = result.response;
      const text = response.text();

      // Clean and process JSON result
      const cleanedText = this.cleanJsonResponse(text);

      return {
        status: 'success',
        rpp: cleanedText
      };
    } catch (error) {
      this.logger.error(`Error generating English lesson: ${error.message}`);

      try {
        // Fallback to another model
        const fallbackModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        const fallbackResult = await fallbackModel.generateContent([systemPrompt, userPrompt]);
        const fallbackResponse = fallbackResult.response;
        const fallbackText = fallbackResponse.text();

        // Clean and process JSON result
        const cleanedText = this.cleanJsonResponse(fallbackText);

        return {
          status: 'success',
          rpp: cleanedText
        };
      } catch (fallbackError) {
        this.logger.error(`Fallback error: ${fallbackError.message}`);
        return {
          status: 'error',
          message: `Error generating content: ${error.message}, Fallback error: ${fallbackError.message}`
        };
      }
    }
  }

  /**
   * Generate teaching materials based on RPP
   */
  async generateBahanAjar(data: BahanAjarDto): Promise<any> {
    const systemPrompt = `
    Kamu adalah seorang ahli pengembangan bahan ajar bahasa Inggris. 
    Buatlah bahan ajar yang komprehensif, interaktif, dan sesuai dengan standar pendidikan Indonesia.
    
    Khusus untuk materi vocabulary tentang profesi/pekerjaan, sertakan daftar profesi dalam bahasa Inggris beserta penjelasan singkat dalam format seperti ini:
    
    Accountant - a person that works with the money and accounts of a company.
    Actor/Actress - a person that acts in a play or a movie.
    Architect - a person that designs building and houses.
    Astronomer - a person who studies the stars and the universe.
    Author - They write books or novels.
    
    Format output bahan ajar harus mengikuti struktur berikut:
    - Penjelasan konsep yang jelas
    - Daftar vocabulary profesi dengan penjelasan
    - Contoh dialog atau teks yang menggunakan vocabulary tersebut
    - Latihan (listening, speaking, reading, writing)
    - Kunci jawaban
    
    Berikan output dalam format JSON yang terstruktur dan lengkap.
    `;

    const userPrompt = `
    Anda adalah asisten AI spesialis pendidikan bahasa Inggris.
    Berdasarkan RPP yang sudah dibuat, buatkan bahan ajar yang lengkap dan sesuai dengan:

    Mata Pelajaran: ${data.mata_pelajaran}
    Jenjang: ${data.jenjang}
    Kelas: ${data.kelas}
    Konten Utama: ${data.konten_utama}
    Tujuan Pembelajaran: ${data.tujuan_pembelajaran}

    Hasilkan bahan ajar bahasa Inggris yang lengkap dengan komponen:
    1. Materi lengkap (teori, konsep, dan penjelasan)
    2. Daftar profesi dalam bahasa Inggris beserta penjelasannya (minimal 15 profesi)
    3. Contoh-contoh percakapan atau teks yang menggunakan vocabulary profesi
    4. Latihan-latihan (exercises) untuk 4 keterampilan bahasa
    5. Kunci jawaban

    Sertakan daftar profesi dengan format seperti berikut (dalam output JSON):
    Accountant - a person that works with the money and accounts of a company.
    Actor/Actress - a person that acts in a play or a movie.
    Architect - a person that designs building and houses.

    Buatkan dalam format yang menarik, jelas, dan sesuai untuk peserta didik pada jenjang tersebut.
    `;

    try {
      // Generate content with Gemini
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent([systemPrompt, userPrompt]);
      const response = result.response;
      const text = response.text();

      // Clean and process JSON result
      const cleanedText = this.cleanJsonResponse(text);

      return {
        status: 'success',
        bahan_ajar: cleanedText
      };
    } catch (error) {
      this.logger.error(`Error generating bahan ajar: ${error.message}`);

      try {
        // Fallback to another model
        const fallbackModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        const fallbackResult = await fallbackModel.generateContent([systemPrompt, userPrompt]);
        const fallbackResponse = fallbackResult.response;
        const fallbackText = fallbackResponse.text();

        // Clean and process JSON result
        const cleanedText = this.cleanJsonResponse(fallbackText);

        return {
          status: 'success',
          bahan_ajar: cleanedText
        };
      } catch (fallbackError) {
        this.logger.error(`Fallback error: ${fallbackError.message}`);
        return {
          status: 'error',
          message: `Error generating bahan ajar: ${error.message}, Fallback error: ${fallbackError.message}`
        };
      }
    }
  }

  /**
   * Generate assessment questions
   */
  async generateQuestions(data: QuestionsDto): Promise<any> {
    const systemPrompt = `
    Kamu adalah seorang ahli dalam membuat soal dan penilaian bahasa Inggris untuk siswa di Indonesia.
    Buatlah soal yang berkualitas, kontekstual, dan SANGAT SESUAI dengan RPP yang telah dibuat.
    Kamu HARUS memastikan semua soal LANGSUNG terkait dengan konten utama, tujuan pembelajaran, dan materi
    dalam RPP. Jangan membuat soal di luar konteks RPP.
    
    Soal yang dibuat harus mencakup 4 jenis yang SALING TERHUBUNG dalam tema dan materi:
    
    1. PILIHAN GANDA - Buatlah 5 soal pilihan ganda dengan 4 opsi jawaban (A, B, C, D)
       - Setiap soal pilihan ganda harus memiliki paragraf narasi atau teks (minimal 5-7 kalimat)
       - Paragraf harus LANGSUNG terkait dengan konten RPP dan menjadi dasar pertanyaan
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
    Buatlah soal evaluasi bahasa Inggris yang SANGAT SESUAI dan TIDAK KELUAR dari RPP dengan informasi berikut:

    Mata Pelajaran: ${data.mata_pelajaran}
    Jenjang: ${data.jenjang}
    Kelas: ${data.kelas}
    Konten Utama: ${data.konten_utama}
    Tujuan Pembelajaran: ${data.tujuan_pembelajaran}
    
    Hasilkan 4 jenis soal yang SALING TERHUBUNG dalam tema yang SAMA:
    
    1. PILIHAN GANDA (5 soal) - Setiap soal harus memiliki:
       - Paragraf yang langsung mengacu pada materi dalam RPP (5-7 kalimat)
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
    - Semua soal HARUS berada dalam cakupan RPP, jangan keluar dari materi RPP
    - Pastikan ada keterkaitan yang jelas antara paragraf, pertanyaan pilihan ganda, soal menjodohkan, 
      pernyataan benar-salah, dan pertanyaan essay
    - Soal benar-salah dan essay harus jelas menunjukkan paragraf mana yang menjadi referensinya
    - Buat soal yang kohesif dan terintegrasi, bukan soal-soal yang berdiri sendiri
    `;

    try {
      // Generate content with Gemini
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent([systemPrompt, userPrompt]);
      const response = result.response;
      const text = response.text();

      // Clean and process JSON result
      const cleanedText = this.cleanJsonResponse(text);

      return {
        status: 'success',
        questions: cleanedText
      };
    } catch (error) {
      this.logger.error(`Error generating questions: ${error.message}`);

      try {
        // Fallback to another model
        const fallbackModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        const fallbackResult = await fallbackModel.generateContent([systemPrompt, userPrompt]);
        const fallbackResponse = fallbackResult.response;
        const fallbackText = fallbackResponse.text();

        // Clean and process JSON result
        const cleanedText = this.cleanJsonResponse(fallbackText);

        return {
          status: 'success',
          questions: cleanedText
        };
      } catch (fallbackError) {
        this.logger.error(`Fallback error: ${fallbackError.message}`);
        return {
          status: 'error',
          message: `Error generating questions: ${error.message}, Fallback error: ${fallbackError.message}`
        };
      }
    }
  }

  /**
   * Generate kisi-kisi (assessment blueprint)
   */
  async generateKisiKisi(data: KisiKisiDto): Promise<any> {
    const rppData = JSON.parse(data.rpp_data);
    const questionsData = JSON.parse(data.questions_data);

    const systemPrompt = `
    Kamu adalah ahli penilaian pendidikan Bahasa Inggris yang menguasai pembuatan kisi-kisi soal untuk sekolah di Indonesia.
    Tugasmu adalah menghasilkan kisi-kisi penulisan soal (blueprint) untuk asesmen bahasa Inggris berdasarkan RPP dan soal yang telah dibuat.
    
    Kisi-kisi ini HARUS mengikuti format sesuai kurikulum merdeka dan mencakup tabel dengan kolom:
    1. Nomor (1, 2, 3, dst)
    2. Tujuan Pembelajaran (diambil dari RPP)
    3. Materi (diambil dari RPP)
    4. Indikator Soal (deskripsikan apa yang diuji oleh soal tersebut)
    5. Level Kognitif (C1-Mengingat, C2-Memahami, C3-Menerapkan, C4-Menganalisis, C5-Mengevaluasi, C6-Mencipta)
    6. Bentuk Soal (Pilihan Ganda, Menjodohkan, Benar-Salah, Essay)
    7. Nomor Soal (sesuai dengan nomor pada soal yang telah dibuat)
    
    PENTING! Kisi-kisi harus mencakup semua jenis soal yang telah dibuat (pilihan ganda, menjodohkan, benar-salah, dan essay).
    Level kognitif harus bervariasi dan sesuai dengan jenis pertanyaan/soal.
    
    Berikan output dalam format JSON yang terstruktur.
    `;

    const userPrompt = `
    Buatlah kisi-kisi penulisan soal untuk asesmen bahasa Inggris berdasarkan data berikut:
    
    RPP (Rencana Pelaksanaan Pembelajaran):
    Mata Pelajaran: ${rppData.mata_pelajaran || 'Bahasa Inggris'}
    Jenjang: ${rppData.jenjang || '-'}
    Kelas: ${rppData.kelas || '-'}
    Alokasi Waktu: ${rppData.alokasi_waktu || '90 menit'}
    Konten Utama: ${rppData.konten_utama || '-'}
    Tujuan Pembelajaran: ${rppData.tujuan_pembelajaran || '-'}
    Nama Penyusun: ${rppData.nama_penyusun || 'Guru Bahasa Inggris'}
    
    Soal yang telah dibuat:
    Judul Soal: ${questionsData.judul || 'Soal Evaluasi Bahasa Inggris'}
    - Pilihan Ganda: 5 soal
    - Menjodohkan: 5 soal
    - Benar-Salah: 5 soal
    - Essay: 2 soal
    
    Buatlah kisi-kisi yang memuat informasi dan tabel kisi-kisi sesuai format yang diminta.
    Pastikan setiap jenis soal memiliki entri dalam tabel kisi-kisi dan level kognitif bervariasi sesuai dengan jenis soal.
    `;

    try {
      // Generate content with Gemini
      const model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent([systemPrompt, userPrompt]);
      const response = result.response;
      const text = response.text();

      // Clean and process JSON result
      const cleanedText = this.cleanJsonResponse(text);

      return {
        status: 'success',
        kisi_kisi: cleanedText
      };
    } catch (error) {
      this.logger.error(`Error generating kisi-kisi: ${error.message}`);

      try {
        // Fallback to another model
        const fallbackModel = this.genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        const fallbackResult = await fallbackModel.generateContent([systemPrompt, userPrompt]);
        const fallbackResponse = fallbackResult.response;
        const fallbackText = fallbackResponse.text();

        // Clean and process JSON result
        const cleanedText = this.cleanJsonResponse(fallbackText);

        return {
          status: 'success',
          kisi_kisi: cleanedText
        };
      } catch (fallbackError) {
        this.logger.error(`Fallback error: ${fallbackError.message}`);
        return {
          status: 'error',
          message: `Error generating kisi-kisi: ${error.message}, Fallback error: ${fallbackError.message}`
        };
      }
    }
  }

  /**
   * Helper method to clean and process JSON responses
   */
  private cleanJsonResponse(text: string): string {
    // Remove markdown code block formatting
    let cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    try {
      // Try to parse JSON to verify validity
      const parsedJson = JSON.parse(cleanedText);
      return JSON.stringify(parsedJson);
    } catch (error) {
      // If parsing fails, try to extract JSON using regex
      const jsonMatch = cleanedText.match(/({.*})/s);
      if (jsonMatch) {
        try {
          const jsonStr = jsonMatch[1];
          const parsedJson = JSON.parse(jsonStr);
          return JSON.stringify(parsedJson);
        } catch (innerError) {
          // If extraction fails, return the original cleaned text
          return cleanedText;
        }
      }

      // If all attempts fail, return the original cleaned text
      return cleanedText;
    }
  }
} 
