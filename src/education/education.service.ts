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
  private readonly GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';
  private readonly MAX_RETRIES = 3;

  private async generateContent(systemPrompt: string, userPrompt: string, schemaExample: any = null): Promise<string> {
    let retries = 0;
    let result: string;

    while (retries < this.MAX_RETRIES) {
      try {
        // Enhance the system prompt with schema example if provided
        let enhancedSystemPrompt = systemPrompt;
        if (schemaExample) {
          enhancedSystemPrompt += "\n\nHere's an example of the EXACT JSON structure expected:\n" +
            JSON.stringify(schemaExample, null, 2) +
            "\n\nYour response MUST follow this exact structure. Fields can be different but the structure must be identical.";
        }

        // Add a clear instruction about JSON format
        enhancedSystemPrompt += "\n\nIMPORTANT: Your response MUST be valid JSON without any markdown formatting, comments, or explanations. DO NOT wrap the JSON in code blocks.";

        // Combine system and user prompts
        const fullPrompt = enhancedSystemPrompt + "\n\n" + userPrompt;

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

        result = data.candidates[0].content.parts[0].text;

        // Clean the response to ensure proper JSON formatting
        const cleanedResult = result
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();

        // Validate JSON structure
        const parsedResult = JSON.parse(cleanedResult);

        // If we have a schema example, validate the structure matches
        if (schemaExample && !this.validateStructure(parsedResult, schemaExample)) {
          throw new Error('Response structure does not match expected schema');
        }

        return cleanedResult;
      } catch (error) {
        console.error(`Error attempt ${retries + 1}/${this.MAX_RETRIES}:`, error);
        retries++;

        // If we've exhausted retries, throw the error
        if (retries >= this.MAX_RETRIES) {
          throw new Error(`Failed to generate valid content after ${this.MAX_RETRIES} attempts: ${error.message}`);
        }

        // Otherwise wait before retrying (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
      }
    }
  }

  // Helper method to validate that the response structure matches the expected schema
  private validateStructure(response: any, schema: any, path: string = ''): boolean {
    // If schema is null or undefined, any response is valid
    if (schema === null || schema === undefined) {
      return true;
    }

    // If types don't match, structure is invalid
    if (typeof response !== typeof schema) {
      console.error(`Structure mismatch at ${path}: expected ${typeof schema}, got ${typeof response}`);
      return false;
    }

    // If it's an array, check that elements match
    if (Array.isArray(schema)) {
      if (!Array.isArray(response)) {
        console.error(`Structure mismatch at ${path}: expected array, got ${typeof response}`);
        return false;
      }

      // If schema array has an example element, validate first response element against it
      // Only validate if both schema and response have elements
      if (schema.length > 0 && response.length > 0) {
        return this.validateStructure(response[0], schema[0], `${path}[0]`);
      }

      return true;
    }

    // If it's an object, check that properties match
    if (typeof schema === 'object') {
      if (typeof response !== 'object' || response === null) {
        console.error(`Structure mismatch at ${path}: expected object, got ${typeof response}`);
        return false;
      }

      // For questions validation specifically, handle the new structure
      if (path === 'questions' || path.startsWith('questions.')) {
        // Check that all required top-level keys exist in questions object
        if (path === 'questions') {
          const requiredKeys = ['pilihan_ganda', 'essay'];
          for (const key of requiredKeys) {
            if (!(key in response)) {
              console.error(`Structure mismatch at ${path}: missing required key ${key}`);
              return false;
            }
          }

          // Validate pilihan_ganda is an array
          if (!Array.isArray(response.pilihan_ganda)) {
            console.error(`Structure mismatch at ${path}.pilihan_ganda: expected array`);
            return false;
          }

          // Validate essay is an array
          if (!Array.isArray(response.essay)) {
            console.error(`Structure mismatch at ${path}.essay: expected array`);
            return false;
          }

          return true;
        }

        return true;
      }

      // For other regular schema validation, check all schema keys exist in response
      for (const key of Object.keys(schema)) {
        if (!(key in response)) {
          console.error(`Structure mismatch at ${path}: missing key ${key}`);
          return false;
        }

        // Recursively validate nested structures
        if (!this.validateStructure(response[key], schema[key], path ? `${path}.${key}` : key)) {
          return false;
        }
      }

      return true;
    }

    // For primitive types, structure is valid
    return true;
  }

  async generateLesson(data: LessonDto): Promise<EducationRppResponse> {
    try {
      // Check for required fields (mata_pelajaran, jenjang, kelas)
      if (!data.mata_pelajaran || !data.jenjang || !data.kelas) {
        throw new Error('Required fields missing: mata_pelajaran, jenjang, and kelas are mandatory');
      }

      // Fill in missing fields with AI-generated content if not provided
      const autoGeneratePrompt = `
      Berdasarkan informasi bahwa ini adalah mata pelajaran ${data.mata_pelajaran} untuk jenjang ${data.jenjang} kelas ${data.kelas},
      berikan rekomendasi untuk komponen RPP berikut:
      ${!data.alokasi_waktu ? '- alokasi_waktu (format pertemuan x menit)' : ''}
      ${!data.tahapan ? '- tahapan pembelajaran' : ''}
      ${!data.capaian_pembelajaran ? '- capaian pembelajaran sesuai kurikulum terbaru' : ''}
      ${!data.domain_konten ? '- domain konten/elemen' : ''}
      ${!data.tujuan_pembelajaran ? '- tujuan pembelajaran (minimal 3-5 tujuan)' : ''}
      ${!data.konten_utama ? '- konten utama pembelajaran' : ''}
      ${!data.prasyarat ? '- prasyarat pengetahuan/keterampilan' : ''}
      ${!data.pemahaman_bermakna ? '- pemahaman bermakna' : ''}
      ${!data.profil_pelajar ? '- profil pelajar pancasila yang relevan' : ''}
      ${!data.sarana ? '- sarana dan prasarana yang diperlukan' : ''}
      ${!data.target_peserta ? '- target peserta didik' : ''}
      ${!data.jumlah_peserta ? '- perkiraan jumlah peserta didik' : ''}
      ${!data.model_pembelajaran ? '- model pembelajaran yang sesuai' : ''}
      ${!data.sumber_belajar ? '- sumber belajar yang direkomendasikan' : ''}
      `;

      // Only call the AI if there are missing fields
      let autoGeneratedFields = {};
      if (autoGeneratePrompt.includes('-')) {
        const systemPrompt = `
        Kamu adalah asisten AI spesialis pendidikan dengan pengalaman mendalam dalam kurikulum Indonesia.
        Berikan rekomendasi untuk komponen RPP yang tidak disediakan oleh pengguna.
        Berikan jawaban dalam format JSON dengan struktur:
        {
          "alokasi_waktu": "string", // contoh: "2x45 menit"
          "tahapan": "string",
          "capaian_pembelajaran": "string",
          "domain_konten": "string",
          "tujuan_pembelajaran": "string",
          "konten_utama": "string",
          "prasyarat": "string",
          "pemahaman_bermakna": "string",
          "profil_pelajar": "string",
          "sarana": "string",
          "target_peserta": "string", 
          "jumlah_peserta": "string",
          "model_pembelajaran": "string",
          "sumber_belajar": "string"
        }
        Sertakan HANYA field yang diminta.
        `;

        const autoGenResult = await this.generateContent(systemPrompt, autoGeneratePrompt);
        autoGeneratedFields = JSON.parse(autoGenResult);
      }

      // Merge user-provided data with auto-generated fields
      const completeData = {
        ...data,
        ...autoGeneratedFields
      };

      // Schema example for RPP
      const schemaExample = {
        "identitas": {
          "nama_penyusun": "Sample Name",
          "institusi": "Sample Institution",
          "tahun_pembuatan": "2023/2024",
          "mata_pelajaran": "Sample Subject",
          "jenjang": "Sample Level",
          "kelas": "Sample Class",
          "alokasi_waktu": "2x45 menit",
          "tahapan": "Sample Stage"
        },
        "komponen_pembelajaran": {
          "capaian_pembelajaran": "Sample learning outcomes",
          "domain_konten": "Sample content domain",
          "tujuan_pembelajaran": ["Sample goal 1", "Sample goal 2"],
          "konten_utama": "Sample main content",
          "prasyarat_pengetahuan": "Sample prerequisites",
          "pemahaman_bermakna": "Sample meaningful understanding",
          "profil_pelajar_pancasila": ["Dimension 1", "Dimension 2"],
          "sarana_prasarana": ["Item 1", "Item 2"],
          "target_peserta_didik": "Sample target",
          "jumlah_peserta_didik": "30-35",
          "model_pembelajaran": "Sample learning model",
          "sumber_belajar": ["Source 1", "Source 2"]
        },
        "kegiatan_pembelajaran": {
          "kegiatan_awal": [
            { "aktivitas": "Sample activity 1", "durasi": "5 menit", "deskripsi": "Sample description" },
            { "aktivitas": "Sample activity 2", "durasi": "5 menit", "deskripsi": "Sample description" }
          ],
          "kegiatan_inti": [
            { "aktivitas": "Sample activity 1", "durasi": "15 menit", "deskripsi": "Sample description" },
            { "aktivitas": "Sample activity 2", "durasi": "15 menit", "deskripsi": "Sample description" }
          ],
          "kegiatan_penutup": [
            { "aktivitas": "Sample activity 1", "durasi": "5 menit", "deskripsi": "Sample description" },
            { "aktivitas": "Sample activity 2", "durasi": "5 menit", "deskripsi": "Sample description" }
          ]
        },
        "materi_assessment": {
          "bahan_ajar": {
            "teori": "Sample theory content",
            "materi_linguistik": "Sample linguistic material",
            "teks": "Sample text content",
            "materi_visual": "Sample visual material"
          },
          "remedial": {
            "aktivitas": ["Activity 1", "Activity 2"],
            "strategi": "Sample remedial strategy",
            "instrumen": "Sample remedial instrument"
          },
          "pengayaan": {
            "aktivitas": ["Activity 1", "Activity 2", "Activity 3"],
            "produk": "Sample expected output"
          },
          "assessment": {
            "rubrik_pengetahuan": {
              "teknik": "Sample technique",
              "bentuk": "Sample form",
              "kisi_kisi": "Sample blueprint",
              "instrumen": ["Question 1", "Question 2", "Question 3", "Question 4", "Question 5"]
            },
            "rubrik_keterampilan": [
              {
                "aspek": "Sample aspect",
                "deskripsi": [
                  { "level": "Level 1", "deskripsi": "Sample description", "skor": 5 },
                  { "level": "Level 2", "deskripsi": "Sample description", "skor": 4 }
                ]
              }
            ]
          }
        }
      };

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
            * Contoh-contoh yang relevan dan kontekstual
            * Teks/materi lengkap yang akan digunakan (minimal 250-300 kata jika berbentuk teks)
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
            * WAJIB MENGGUNAKAN FORMAT RUBRIK
         1. Rubrik penilaian pengetahuan
             a. Teknik penilaian: Tes tertulis/lisan/praktik (sesuaikan dengan mata pelajaran)
             b. Bentuk Instrumen: Sesuaikan dengan mata pelajaran (contoh: menyebutkan konsep, menjelaskan proses, mendemonstrasikan keterampilan)
             c. Kisi-kisi: Jelaskan apa yang diuji dan sumber materinya
             d. Instrumen penilaian: (Sertakan minimal 5 soal sesuai materi)

          2. Rubrik untuk penilaian keterampilan
             Gunakan tabel dengan format:

             | No | Aspek | Deskripsi | Skor |
             |----|-------|-----------|------|
             | 1 | Aspek 1 | 1. Sangat baik | 5 |
             |   |         | 2. Baik | 4 |
             |   |         | 3. Cukup | 3 |
             |   |         | 4. Kurang | 2 |
             |   |         | 5. Sangat kurang | 1 |
             | 2 | Aspek 2 | a. Sangat baik | 5 |
             |   |         | b. Baik | 4 |
             |   |         | c. Cukup | 3 |
             |   |         | d. Kurang | 2 |
             |   |         | e. Sangat kurang | 1 |

             Penentuan Nilai: nilaiSiswa = skorDiperoleh/skorMaksimal * 100

          * Tambahkan juga penilaian aspek lain sesuai dengan konteks pembelajaran dengan format yang serupa
          * Sediakan instrumen lengkap dengan soal-soal SPESIFIK (minimal 5 soal per jenis)
          * Rubrik penilaian DETAIL dengan kriteria dan pembobotan
          * Pedoman penskoran dan interpretasi hasil
          * Strategi umpan balik kepada siswa

      Berikan output dalam format JSON yang sangat terstruktur dan komprehensif.

      PENTING: Pastikan semua detil diisi dengan SANGAT LENGKAP dan SPESIFIK sesuai dengan data masukan. Gunakan kalimat lengkap dan paragraf yang kohesif untuk setiap bagian narasi. Jangan gunakan placeholder atau template language. Semua informasi harus KONTEKSTUAL dan BERMAKNA. Pastikan output HANYA berisi JSON tanpa tag backtick atau tambahan apapun.
      `;

      const userPrompt = `
      Anda adalah asisten AI yang ahli dalam menyusun Rencana Pelaksanaan Pembelajaran (RPP).
      Buatkan RPP lengkap dengan detail berikut:

      Nama Penyusun: ${completeData.nama_penyusun || 'Guru Professional'}
      Institusi: ${completeData.institusi || 'Sekolah Indonesia'}
      Tahun Pembuatan: ${completeData.tahun_pembuatan || '2023/2024'}
      Mata Pelajaran: ${completeData.mata_pelajaran}
      Jenjang: ${completeData.jenjang}
      Kelas: ${completeData.kelas}
      Alokasi Waktu: ${completeData.alokasi_waktu || '2x45 menit'}
      Tahapan: ${completeData.tahapan || 'Pertemuan ke-1'}
      Capaian Pembelajaran (CP): ${completeData.capaian_pembelajaran || '-'}
      Domain Konten/Elemen: ${completeData.domain_konten || '-'}
      Tujuan pembelajaran: ${completeData.tujuan_pembelajaran || '-'}
      Konten Utama: ${completeData.konten_utama || '-'}
      Prasyarat pengetahuan/Keterampilan: ${completeData.prasyarat || '-'}
      Pemahaman bermakna: ${completeData.pemahaman_bermakna || '-'}
      Profil pelajar pancasila yang berkaitan: ${completeData.profil_pelajar || '-'}
      Sarana dan Prasarana: ${completeData.sarana || '-'}
      Target peserta didik: ${completeData.target_peserta || '-'}
      Jumlah peserta didik: ${completeData.jumlah_peserta || '-'}
      Model pembelajaran: ${completeData.model_pembelajaran || '-'}
      Sumber belajar: ${completeData.sumber_belajar || '-'}
      ${completeData.catatan ? `Catatan Tambahan: ${completeData.catatan}` : ''}

      Hasilkan RPP yang lengkap dengan isi untuk setiap bagian berikut:
      1. Kegiatan awal (15 Menit) - berisi langkah-langkah kegiatan pendahuluan yang dilakukan guru
      2. Kegiatan Inti (90 Menit) - berisi langkah-langkah kegiatan utama pembelajaran dengan detail aktivitas
      3. Penutup (15 Menit) - berisi langkah-langkah kegiatan penutup pembelajaran
      4. Bahan ajar - berisi materi yang akan diajarkan secara detail
      5. Remedial - kegiatan remedial untuk siswa yang belum mencapai KKM
      6. Pengayaan - kegiatan pengayaan untuk siswa yang sudah mencapai KKM
      7. Asessmen - berisi instrumen penilaian, rubrik, dan kriteria
      `;

      const result = await this.generateContent(systemPrompt, userPrompt, schemaExample);

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
      // Check for required fields (mata_pelajaran, kelas, materi)
      if (!data.mata_pelajaran || !data.kelas || !data.materi) {
        throw new Error('Required fields missing: mata_pelajaran, kelas, and materi are mandatory');
      }

      // Schema example for Bahan Ajar
      const schemaExample = {
        "bahan_ajar": {
          "judul": "Sample Title",
          "deskripsi": "Sample Description",
          "materi": {
            "penjelasan": "Sample explanation",
            "istilah_penting": [
              { "istilah": "Term 1", "penjelasan": "Explanation 1" },
              { "istilah": "Term 2", "penjelasan": "Explanation 2" }
            ]
          },
          "contoh": [
            "Sample example 1",
            "Sample example 2"
          ],
          "latihan": {
            "pemahaman": ["Question 1", "Question 2"],
            "penerapan": ["Question 1", "Question 2"],
            "analisis": ["Question 1", "Question 2"],
            "evaluasi": ["Question 1", "Question 2"]
          },
          "kunci_jawaban": {
            "latihan_1": ["Answer 1", "Answer 2"],
            "latihan_2": ["Answer 1", "Answer 2"]
          }
        }
      };

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

      const result = await this.generateContent(systemPrompt, userPrompt, schemaExample);

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
      // Check for required fields (mata_pelajaran, kelas, materi)
      if (!data.mata_pelajaran || !data.kelas || !data.materi) {
        throw new Error('Required fields missing: mata_pelajaran, kelas, and materi are mandatory');
      }

      // Schema example for Questions
      const schemaExample = {
        "questions": {
          "pilihan_ganda": [
            {
              "paragraf": "Sample paragraph",
              "pertanyaan": "Sample question",
              "opsi": ["A. Option 1", "B. Option 2", "C. Option 3", "D. Option 4"],
              "jawaban_benar": "A. Option 1"
            }
          ],
          "essay": [
            {
              "pertanyaan": "Sample essay question 1",
              "panduan_jawaban": "Sample answer guide",
              "referensi_paragraf": 1
            }
          ]
        }
      };

      const systemPrompt = `
      Kamu adalah seorang ahli dalam membuat soal dan penilaian untuk siswa di Indonesia.
      Tugasmu adalah menghasilkan soal-soal berkualitas tinggi sesuai dengan materi pembelajaran.
      
      PENTING: Kamu HARUS mengembalikan respons dalam format JSON yang VALID dan sesuai dengan struktur berikut:
      
      {
        "questions": {
          "pilihan_ganda": [
            {
              "paragraf": "Teks paragraf yang berisi materi",
              "pertanyaan": "Pertanyaan yang berkaitan dengan paragraf",
              "opsi": ["A. Pilihan 1", "B. Pilihan 2", "C. Pilihan 3", "D. Pilihan 4"],
              "jawaban_benar": "A. Pilihan 1"
            },
            ... (total 30 soal pilihan ganda)
          ],
          "essay": [
            {
              "pertanyaan": "Pertanyaan essay yang meminta analisis",
              "panduan_jawaban": "Panduan jawaban untuk guru",
              "referensi_paragraf": 1
            },
            ... (total 5 soal essay)
          ]
        }
      }
      
      PERSYARATAN SOAL:
      1. PILIHAN GANDA (30 soal):
         - Setiap soal harus memiliki paragraf narasi/teks (5-7 kalimat)
         - Paragraf harus terkait dengan materi pembelajaran
         - Pertanyaan harus langsung berkaitan dengan isi paragraf
         - Setiap soal harus memiliki 4 pilihan jawaban (A, B, C, D)
         - Jawaban benar harus ditentukan dengan jelas
      
      2. ESSAY (5 soal):
         - Soal essay harus meminta siswa menganalisis, mensintesis, atau mengevaluasi
         - Setiap soal essay harus mengacu pada paragraf tertentu dari soal pilihan ganda
         - Berikan panduan jawaban yang jelas untuk guru
         - Tentukan nomor paragraf yang menjadi referensi (referensi_paragraf)
      
      PENTING:
      - JANGAN menambahkan teks atau penjelasan di luar struktur JSON
      - JANGAN menggunakan format markdown atau kode
      - JANGAN menambahkan komentar atau catatan tambahan
      - Pastikan JSON valid dan dapat di-parse
      - Pastikan jumlah soal sesuai (30 pilihan ganda, 5 essay)
      `;

      const userPrompt = `
      Buatkan soal evaluasi untuk:
      
      Mata Pelajaran: ${data.mata_pelajaran}
      Kelas: ${data.kelas}
      Materi: ${data.materi}
      
      Hasilkan:
      1. 30 soal pilihan ganda dengan paragraf, pertanyaan, 4 pilihan jawaban, dan jawaban benar
      2. 5 soal essay dengan pertanyaan, panduan jawaban, dan referensi ke paragraf tertentu
      
      Pastikan semua soal berkaitan dengan materi yang diberikan dan sesuai dengan tingkat kelas.
      `;

      // Generate content with more specific instructions
      const result = await this.generateContent(systemPrompt, userPrompt, schemaExample);

      // Parse the string result into a JSON object
      const parsedResult = JSON.parse(result);

      // Validate the structure of the parsed result
      if (!parsedResult.questions ||
        !Array.isArray(parsedResult.questions.pilihan_ganda) ||
        !Array.isArray(parsedResult.questions.essay)) {
        throw new Error('Invalid response structure: missing required fields or incorrect data types');
      }

      // Validate the number of questions with some flexibility
      const pilihanGandaCount = parsedResult.questions.pilihan_ganda.length;
      const essayCount = parsedResult.questions.essay.length;

      // Allow for a small margin of error (at least 28 multiple choice questions)
      if (pilihanGandaCount < 28) {
        throw new Error(`Invalid number of multiple choice questions: expected at least 28, got ${pilihanGandaCount}`);
      }

      // If we have fewer than 30 multiple choice questions, add a note to the response
      let message = `Questions for ${data.mata_pelajaran} generated successfully`;
      if (pilihanGandaCount < 30) {
        message += ` (Note: Generated ${pilihanGandaCount} multiple choice questions instead of 30)`;
      }

      // Validate essay questions (should be exactly 5)
      if (essayCount !== 5) {
        throw new Error(`Invalid number of essay questions: expected 5, got ${essayCount}`);
      }

      // Validate the structure of each question
      for (let i = 0; i < parsedResult.questions.pilihan_ganda.length; i++) {
        const question = parsedResult.questions.pilihan_ganda[i];
        if (!question.paragraf || !question.pertanyaan || !Array.isArray(question.opsi) || question.opsi.length !== 4 || !question.jawaban_benar) {
          throw new Error(`Invalid multiple choice question structure at index ${i}`);
        }
      }

      for (let i = 0; i < parsedResult.questions.essay.length; i++) {
        const question = parsedResult.questions.essay[i];
        if (!question.pertanyaan || !question.panduan_jawaban || typeof question.referensi_paragraf !== 'number') {
          throw new Error(`Invalid essay question structure at index ${i}`);
        }
      }

      return {
        status: 'success',
        message: message,
        questions: parsedResult
      };
    } catch (error) {
      console.error('Error generating questions:', error);
      return {
        status: 'error',
        message: error.message
      };
    }
  }

  async generateKisiKisi(data: KisiKisiDto): Promise<EducationKisiKisiResponse> {
    try {
      // Check for required fields (mata_pelajaran, kelas, materi)
      if (!data.mata_pelajaran || !data.kelas || !data.materi) {
        throw new Error('Required fields missing: mata_pelajaran, kelas, and materi are mandatory');
      }

      // Schema example for Kisi-Kisi
      const schemaExample = {
        "kisi_kisi": {
          "identitas": {
            "mata_pelajaran": "Sample Subject",
            "kelas": "Sample Class",
            "materi": "Sample Material"
          },
          "tabel_kisi_kisi": [
            {
              "nomor": 1,
              "tujuan_pembelajaran": "Sample learning objective",
              "materi": "Sample material",
              "indikator_soal": "Sample indicator",
              "level_kognitif": "C1-Mengingat",
              "bentuk_soal": "Pilihan Ganda",
              "nomor_soal": "1"
            }
          ]
        }
      };

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

      const result = await this.generateContent(systemPrompt, userPrompt, schemaExample);

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
