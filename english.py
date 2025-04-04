from flask import Flask, request, jsonify, render_template
import os
import google.generativeai as genai
from dotenv import load_dotenv
import json
import re

load_dotenv()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

app = Flask(__name__)

# Configure Gemini API
genai.configure(api_key=GEMINI_API_KEY)

# Function to save data to rpp.json
def save_to_json(data, key=None):
    try:
        # Path to the JSON file
        json_file = os.path.join(os.path.dirname(__file__), 'rpp.json')
        
        # Read existing data if file exists
        if os.path.exists(json_file):
            with open(json_file, 'r', encoding='utf-8') as f:
                try:
                    file_data = json.load(f)
                except json.JSONDecodeError:
                    file_data = {}
        else:
            file_data = {}
        
        # Update the data
        if key:
            file_data[key] = data
        else:
            file_data.update(data)
        
        # Write updated data back to the file
        with open(json_file, 'w', encoding='utf-8') as f:
            json.dump(file_data, f, ensure_ascii=False, indent=2)
        
        return True
    except Exception as e:
        print(f"Error saving to JSON: {str(e)}")
        return False

def generate_english_lesson(data):
    # Format required fields
    system_prompt = """
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

    Berikan output dalam format JSON yang sangat terstruktur dan komprehensif seperti contoh berikut:

    {
      "rpp_bahasa_inggris": {
        "identitas": {
          "nama_penyusun": "string dengan gelar lengkap",
          "institusi": "string nama lengkap sekolah",
          "tahun_pembuatan": "string format tahun ajaran",
          "mata_pelajaran": "string dengan spesifikasi fokus",
          "jenjang": "string lengkap",
          "kelas": "string dengan detil tingkat",
          "alokasi_waktu": "string format lengkap",
          "tahapan": "string detil tahapan"
        },
        "komponen_pembelajaran": {
          "capaian_pembelajaran": "string lengkap merujuk kurikulum",
          "domain_konten": "string detil domain dan proporsi",
          "tujuan_pembelajaran": ["string tujuan 1 dengan format ABCD", "string tujuan 2", "string tujuan 3"],
          "konten_utama": {
            "linguistik": ["string elemen linguistik 1", "string elemen linguistik 2"],
            "tematik": "string tema dan subtema yang dibahas"
          },
          "prasyarat_pengetahuan": ["string prasyarat 1", "string prasyarat 2"],
          "pemahaman_bermakna": "string esensi pembelajaran",
          "profil_pelajar_pancasila": {
            "dimensi_1": "string penjelasan kaitan dengan pembelajaran",
            "dimensi_2": "string penjelasan kaitan dengan pembelajaran",
            "dimensi_3": "string penjelasan kaitan dengan pembelajaran"
          },
          "sarana_prasarana": ["string sarana 1 dengan spesifikasi", "string sarana 2 dengan spesifikasi"],
          "target_peserta_didik": "string karakteristik spesifik",
          "jumlah_peserta_didik": "string jumlah atau rentang",
          "model_pembelajaran": {
            "nama_model": "string nama model",
            "alasan_pemilihan": "string justifikasi     pemilihan model",
            "tahapan": ["string tahap 1", "string tahap 2", "string tahap 3"]
          },
          "sumber_belajar": ["string referensi 1 format akademik", "string referensi 2 format akademik"],
          "catatan": "string catatan tambahan (jika ada)"
        },
        "kegiatan_pembelajaran": {
          "kegiatan_awal": {
            "durasi": "15 Menit",
            "langkah_kegiatan": [
              {"aktivitas": "string deskripsi aktivitas 1", "waktu": "2 menit", "peran_guru": "string", "peran_siswa": "string"},
              {"aktivitas": "string deskripsi aktivitas 2", "waktu": "3 menit", "peran_guru": "string", "peran_siswa": "string"},
              {"aktivitas": "string deskripsi aktivitas 3", "waktu": "5 menit", "peran_guru": "string", "peran_siswa": "string"},
              {"aktivitas": "string deskripsi aktivitas 4", "waktu": "5 menit", "peran_guru": "string", "peran_siswa": "string"}
            ]
          },
          "kegiatan_inti": {
            "durasi": "90 Menit",
            "langkah_kegiatan": [
              {"aktivitas": "string deskripsi aktivitas 1", "waktu": "15 menit", "peran_guru": "string", "peran_siswa": "string", "pengelompokan": "string", "pertanyaan_kunci": ["string"]},
              {"aktivitas": "string deskripsi aktivitas 2", "waktu": "20 menit", "peran_guru": "string", "peran_siswa": "string", "pengelompokan": "string", "pertanyaan_kunci": ["string"]},
              {"aktivitas": "string deskripsi aktivitas 3", "waktu": "25 menit", "peran_guru": "string", "peran_siswa": "string", "pengelompokan": "string", "pertanyaan_kunci": ["string"]},
              {"aktivitas": "string deskripsi aktivitas 4", "waktu": "30 menit", "peran_guru": "string", "peran_siswa": "string", "pengelompokan": "string", "pertanyaan_kunci": ["string"]}
            ],
            "strategi_diferensiasi": {
              "kemampuan_tinggi": "string strategi",
              "kemampuan_sedang": "string strategi",
              "kemampuan_rendah": "string strategi"
            }
          },
          "kegiatan_penutup": {
            "durasi": "15 Menit",
            "langkah_kegiatan": [
              {"aktivitas": "string deskripsi aktivitas 1", "waktu": "3 menit", "peran_guru": "string", "peran_siswa": "string"},
              {"aktivitas": "string deskripsi aktivitas 2", "waktu": "4 menit", "peran_guru": "string", "peran_siswa": "string"},
              {"aktivitas": "string deskripsi aktivitas 3", "waktu": "4 menit", "peran_guru": "string", "peran_siswa": "string"},
              {"aktivitas": "string deskripsi aktivitas 4", "waktu": "4 menit", "peran_guru": "string", "peran_siswa": "string"}
            ],
            "pertanyaan_refleksi": ["string pertanyaan 1", "string pertanyaan 2", "string pertanyaan 3"]
          }
        },
        "materi_dan_assessment": {
          "bahan_ajar": {
            "teori": "string penjelasan konsep dan aplikasi min. 250 kata",
            "materi_linguistik": {
              "grammar": "string penjelasan konsep grammar dengan contoh",
              "vocabulary": "string daftar kosakata dengan definisi dan contoh kalimat"
            },
            "teks_lengkap": "string teks utuh yang digunakan dalam pembelajaran",
            "materi_visual": "string deskripsi gambar/grafik/bagan"
          },
          "remedial": {
            "aktivitas": "string deskripsi aktivitas remedial detail",
            "strategi_intervensi": ["string strategi 1", "string strategi 2"],
            "instrumen_penilaian": "string contoh instrumen penilaian remedial"
          },
          "pengayaan": {
            "aktivitas": ["string aktivitas 1", "string aktivitas 2", "string aktivitas 3"],
            "produk_yang_diharapkan": "string deskripsi output atau produk akhir"
          },
          "assessment": {
            "penilaian_pengetahuan": {
              "teknik": "Tes tertulis",
              "bentuk_instrumen": "Menyebutkan macam-macam profesi dalam Bahasa Inggris",
              "kisi_kisi": "Mengamati gambar yang ada di buku siswa halaman 11",
              "instrumen": ["string soal 1", "string soal 2", "string soal 3", "string soal 4", "string soal 5"],
              "kunci_jawaban": ["string kunci 1", "string kunci 2", "string kunci 3", "string kunci 4", "string kunci 5"],
              "pedoman_penskoran": "string pedoman lengkap"
            },
            "penilaian_keterampilan_mengucapkan": {
              "teknik": "Tes lisan",
              "aspek_penilaian": [
                {
                  "nama_aspek": "Pengucapan",
                  "deskripsi": [
                    {"level": "Sempurna", "skor": 5},
                    {"level": "Ada kesalahan tapi tidak mengganggu makna", "skor": 4},
                    {"level": "Ada beberapa kesalahan dan mengganggu makna", "skor": 3},
                    {"level": "Banyak kesalahan dan mengganggu makna", "skor": 2},
                    {"level": "Terlalu banyak kesalahan sehingga sulit untuk dipahami", "skor": 1}
                  ]
                },
                {
                  "nama_aspek": "Pilihan Kata",
                  "deskripsi": [
                    {"level": "Sangat variatif dan tepat", "skor": 5},
                    {"level": "Variatif dan tepat", "skor": 4},
                    {"level": "Cukup variatif dan tepat", "skor": 3},
                    {"level": "Kurang variatif dan tepat", "skor": 2},
                    {"level": "Tidak variatif dan tepat", "skor": 1}
                  ]
                }
              ],
              "penentuan_nilai": "nilaiSiswa = skorDiperoleh/skorMaksimal * 100",
              "instrumen": "string contoh instrumen untuk penilaian keterampilan mengucapkan"
            },
            "penilaian_keterampilan_lainnya": {
              "teknik": "string teknik yang digunakan",
              "instrumen": "string contoh instrumen",
              "rubrik": {
                "kriteria_1": {
                  "sangat_baik": "string deskriptor",
                  "baik": "string deskriptor",
                  "cukup": "string deskriptor",
                  "perlu_bimbingan": "string deskriptor"
                },
                "kriteria_2": {
                  "sangat_baik": "string deskriptor",
                  "baik": "string deskriptor",
                  "cukup": "string deskriptor",
                  "perlu_bimbingan": "string deskriptor"
                }
              },
              "pedoman_penskoran": "string pedoman lengkap"
            }
          }
        }
      }
    }

    PENTING: Pastikan semua detil diisi dengan SANGAT LENGKAP dan SPESIFIK sesuai dengan data masukan. Gunakan kalimat lengkap dan paragraf yang kohesif untuk setiap bagian narasi. Jangan gunakan placeholder atau template language. Semua informasi harus KONTEKSTUAL dan BERMAKNA untuk pembelajaran bahasa Inggris. Pastikan output HANYA berisi JSON tanpa tag backtick atau tambahan apapun.
    """

    user_prompt = f"""
    Anda adalah asisten AI yang ahli dalam menyusun Rencana Pelaksanaan Pembelajaran (RPP) untuk mata pelajaran Bahasa Inggris.
    Buatkan RPP lengkap dengan detail berikut:

    Nama Penyusun: {data.get('nama_penyusun', '-')}
    Institusi: {data.get('institusi', '-')}
    Tahun Pembuatan: {data.get('tahun_pembuatan', '-')}
    Mata Pelajaran: {data.get('mata_pelajaran')}
    Jenjang: {data.get('jenjang')}
    Kelas: {data.get('kelas')}
    Alokasi Waktu: {data.get('alokasi_waktu')}
    Tahapan: {data.get('tahapan')}
    Capaian Pembelajaran (CP): {data.get('capaian_pembelajaran', '-')}
    Domain Konten/Elemen: {data.get('domain_konten')}
    Tujuan pembelajaran: {data.get('tujuan_pembelajaran')}
    Konten Utama: {data.get('konten_utama')}
    Prasyarat pengetahuan/Keterampilan: {data.get('prasyarat', '-')}
    Pemahaman bermakna: {data.get('pemahaman_bermakna', '-')}
    Profil pelajar pancasila yang berkaitan: {data.get('profil_pelajar', '-')}
    Sarana dan Prasarana: {data.get('sarana', '-')}
    Target peserta didik: {data.get('target_peserta', '-')}
    Jumlah peserta didik: {data.get('jumlah_peserta', '-')}
    Model pembelajaran: {data.get('model_pembelajaran', '-')}
    Sumber belajar: {data.get('sumber_belajar', '-')}
    {f"Catatan Tambahan: {data.get('catatan')}" if data.get('catatan') else ""}

    Hasilkan RPP Bahasa Inggris yang lengkap dengan isi untuk setiap bagian berikut:
    1. Kegiatan awal (15 Menit) - berisi langkah-langkah kegiatan pendahuluan yang dilakukan guru
    2. Kegiatan Inti (90 Menit) - berisi langkah-langkah kegiatan utama pembelajaran dengan detail aktivitas
    3. Penutup (15 Menit) - berisi langkah-langkah kegiatan penutup pembelajaran
    4. Bahan ajar - berisi materi yang akan diajarkan secara detail
    5. Remedial - kegiatan remedial untuk siswa yang belum mencapai KKM
    6. Pengayaan - kegiatan pengayaan untuk siswa yang sudah mencapai KKM
    7. Asessmen - berisi instrumen penilaian, rubrik, dan kriteria

    PENTING: Berikan output dalam format JSON lengkap. Pastikan output HANYA berisi JSON tanpa tag backtick atau tambahan apapun.
    """

    full_prompt = system_prompt + "\n\n" + user_prompt

    try:
        # Create a Gemini model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Generate content with Gemini
        response = model.generate_content(full_prompt)
        
        result = response.text
        
        # Clean the response - remove any markdown code block formatting or extra text
        result = re.sub(r'```json\s*', '', result)
        result = re.sub(r'```\s*', '', result)
        
        # Try to parse JSON to verify its validity
        try:
            parsed_json = json.loads(result)
            # Return the properly formatted JSON string
            return json.dumps(parsed_json, ensure_ascii=False)
        except json.JSONDecodeError:
            # If the response isn't valid JSON, try to extract JSON using regex
            json_match = re.search(r'({.*})', result, re.DOTALL)
            if json_match:
                try:
                    json_str = json_match.group(1)
                    parsed_json = json.loads(json_str)
                    return json.dumps(parsed_json, ensure_ascii=False)
                except:
                    pass
            
            # If all attempts fail, return the original response
            return result
            
    except Exception as e:
        print(f"Error with Gemini API: {str(e)}")
        # Try fallback to another model
        try:
            model = genai.GenerativeModel('gemini-1.5-pro')
            
            response = model.generate_content(full_prompt)
            
            result = response.text
            
            # Clean the response - remove any markdown code block formatting
            result = re.sub(r'```json\s*', '', result)
            result = re.sub(r'```\s*', '', result)
            
            # Try to parse JSON to verify its validity
            try:
                parsed_json = json.loads(result)
                return json.dumps(parsed_json, ensure_ascii=False)
            except json.JSONDecodeError:
                # If the response isn't valid JSON, try to extract JSON using regex
                json_match = re.search(r'({.*})', result, re.DOTALL)
                if json_match:
                    try:
                        json_str = json_match.group(1)
                        parsed_json = json.loads(json_str)
                        return json.dumps(parsed_json, ensure_ascii=False)
                    except:
                        pass
                
                # If all attempts fail, return the original response
                return result
                
        except Exception as inner_e:
            print(f"Fallback error: {str(inner_e)}")
            raise Exception(f"Failed to generate content: {str(e)}, Fallback error: {str(inner_e)}")

def generate_bahan_ajar(data):
    # Format required fields for bahan ajar generation
    system_prompt = """
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
    
    Berikan output dalam format JSON yang terstruktur dan lengkap seperti berikut:
    
    {
      "bahan_ajar": {
        "judul": "string",
        "deskripsi": "string",
        "materi": {
          "penjelasan": "string",
          "vocabulary": [
            {"profesi": "Accountant", "penjelasan": "a person that works with the money and accounts of a company."},
            {"profesi": "Actor/Actress", "penjelasan": "a person that acts in a play or a movie."}
          ]
        },
        "contoh": [
          "string (dialog/teks)",
          "string"
        ],
        "latihan": {
          "listening": ["string", "string"],
          "speaking": ["string", "string"],
          "reading": ["string", "string"],
          "writing": ["string", "string"]
        },
        "kunci_jawaban": {
          "latihan_1": ["string", "string"],
          "latihan_2": ["string", "string"]
        }
      }
    }
    """

    user_prompt = f"""
    Anda adalah asisten AI spesialis pendidikan bahasa Inggris.
    Berdasarkan RPP yang sudah dibuat, buatkan bahan ajar yang lengkap dan sesuai dengan:

    Mata Pelajaran: {data.get('mata_pelajaran')}
    Jenjang: {data.get('jenjang')}
    Kelas: {data.get('kelas')}
    Konten Utama: {data.get('konten_utama')}
    Tujuan Pembelajaran: {data.get('tujuan_pembelajaran')}

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
    """

    full_prompt = system_prompt + "\n\n" + user_prompt

    try:
        # Create a Gemini model
        model = genai.GenerativeModel('gemini-2.0-flash')
        
        # Generate content with Gemini
        response = model.generate_content(full_prompt)
        
        result = response.text
        
        # Clean the response 
        result = re.sub(r'```json\s*', '', result)
        result = re.sub(r'```\s*', '', result)
        
        # Try to parse JSON to verify its validity
        try:
            parsed_json = json.loads(result)
            # Return the properly formatted JSON string
            return json.dumps(parsed_json, ensure_ascii=False)
        except json.JSONDecodeError:
            # If JSON parsing fails, return the original text
            return result
            
    except Exception as e:
        print(f"Error generating bahan ajar: {str(e)}")
        try:
            # Try fallback to another model
            model = genai.GenerativeModel('gemini-1.5-pro')
            
            response = model.generate_content(full_prompt)
            
            result = response.text
            
            # Clean the response 
            result = re.sub(r'```json\s*', '', result)
            result = re.sub(r'```\s*', '', result)
            
            # Try to parse JSON to verify its validity
            try:
                parsed_json = json.loads(result)
                # Return the properly formatted JSON string
                return json.dumps(parsed_json, ensure_ascii=False)
            except json.JSONDecodeError:
                # If JSON parsing fails, return the original text
                return result
                
        except Exception as inner_e:
            print(f"Fallback error: {str(inner_e)}")
            return f"Error: {str(e)}, Fallback error: {str(inner_e)}"

def generate_english_questions(data):
    # Format required fields for question generation
    system_prompt = """
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
    
    Berikan output dalam format JSON yang terstruktur dan lengkap seperti berikut:
    
    {
      "soal_bahasa_inggris": {
        "judul": "Soal Evaluasi Bahasa Inggris - [Topik yang SAMA dengan RPP]",
        "kelas": "string tingkat/kelas",
        "identitas": {
          "nama_sekolah": "string",
          "mata_pelajaran": "Bahasa Inggris",
          "alokasi_waktu": "string format waktu",
          "petunjuk": "string instruksi untuk siswa"
        },
        "pilihan_ganda": [
          {
            "nomor": 1,
            "paragraf": "string paragraf yang terkait langsung dengan RPP (5-7 kalimat)",
            "pertanyaan": "string pertanyaan tentang paragraf",
            "pilihan": {
              "A": "string pilihan A",
              "B": "string pilihan B",
              "C": "string pilihan C",
              "D": "string pilihan D"
            },
            "kunci_jawaban": "string huruf jawaban benar (A/B/C/D)"
          },
          // 4 soal pilihan ganda lainnya dengan format yang sama
        ],
        "menjodohkan": {
          "petunjuk": "string instruksi khusus",
          "soal": [
            {
              "nomor": 1,
              "kolom_a": "string konten kolom kiri yang terkait dengan paragraf",
              "kolom_b": "string konten kolom kanan yang benar"
            },
            // 4 soal menjodohkan lainnya dengan format yang sama
          ]
        },
        "benar_salah": [
          {
            "nomor": 1,
            "terkait_paragraf": "nomor paragraf pilihan ganda yang terkait (1-5)",
            "pernyataan": "string pernyataan yang mengacu pada informasi dalam paragraf",
            "kunci_jawaban": "true/false"
          },
          // 4 soal benar/salah lainnya dengan format yang sama
        ],
        "essay": [
          {
            "nomor": 1,
            "terkait_paragraf": "nomor paragraf pilihan ganda yang terkait (1-5)",
            "pertanyaan": "string pertanyaan essay yang meminta analisis/sintesis dari paragraf",
            "panduan_jawaban": "string panduan jawaban untuk guru yang mengacu pada paragraf"
          },
          {
            "nomor": 2,
            "terkait_paragraf": "nomor paragraf pilihan ganda yang terkait (1-5)",
            "pertanyaan": "string pertanyaan essay yang meminta analisis/sintesis dari paragraf",
            "panduan_jawaban": "string panduan jawaban untuk guru yang mengacu pada paragraf"
          }
        ]
      }
    }
    
    PENTING: Pastikan semua soal:
    1. HARUS 100% mengacu pada konten RPP (jangan membuat soal di luar materi RPP)
    2. Menggunakan bahasa Inggris yang sesuai dengan tingkat/jenjang siswa
    3. Paragraf dan pertanyaan harus memiliki keterkaitan yang jelas dan logis
    4. Semua jenis soal (pilihan ganda, menjodohkan, benar-salah, essay) harus terhubung dalam tema yang sama
    5. Untuk soal benar-salah dan essay, WAJIB menuliskan nomor paragraf yang terkait sebagai referensi
    
    Outputkan dalam format JSON yang valid. Pastikan struktur JSON sesuai dengan yang telah ditentukan.
    """

    user_prompt = f"""
    Buatlah soal evaluasi bahasa Inggris yang SANGAT SESUAI dan TIDAK KELUAR dari RPP dengan informasi berikut:

    Mata Pelajaran: {data.get('mata_pelajaran')}
    Jenjang: {data.get('jenjang')}
    Kelas: {data.get('kelas')}
    Konten Utama: {data.get('konten_utama')}
    Tujuan Pembelajaran: {data.get('tujuan_pembelajaran')}
    
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
    """

    full_prompt = system_prompt + "\n\n" + user_prompt

    try:
        # Create a Gemini model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Generate content with Gemini
        response = model.generate_content(full_prompt)
        
        result = response.text
        
        # Clean the response - remove any markdown code block formatting or extra text
        result = re.sub(r'```json\s*', '', result)
        result = re.sub(r'```\s*', '', result)
        
        # Try to parse JSON to verify its validity
        try:
            parsed_json = json.loads(result)
            # Return the properly formatted JSON string
            return json.dumps(parsed_json, ensure_ascii=False)
        except json.JSONDecodeError:
            # If the response isn't valid JSON, try to extract JSON using regex
            json_match = re.search(r'({.*})', result, re.DOTALL)
            if json_match:
                try:
                    json_str = json_match.group(1)
                    parsed_json = json.loads(json_str)
                    return json.dumps(parsed_json, ensure_ascii=False)
                except:
                    pass
            
            # If all attempts fail, return the original response
            return result
            
    except Exception as e:
        print(f"Error generating questions: {str(e)}")
        # Try fallback to another model
        try:
            model = genai.GenerativeModel('gemini-1.5-pro')
            
            response = model.generate_content(full_prompt)
            
            result = response.text
            
            # Clean the response - remove any markdown code block formatting
            result = re.sub(r'```json\s*', '', result)
            result = re.sub(r'```\s*', '', result)
            
            # Try to parse JSON to verify its validity
            try:
                parsed_json = json.loads(result)
                return json.dumps(parsed_json, ensure_ascii=False)
            except json.JSONDecodeError:
                # If the response isn't valid JSON, try to extract JSON using regex
                json_match = re.search(r'({.*})', result, re.DOTALL)
                if json_match:
                    try:
                        json_str = json_match.group(1)
                        parsed_json = json.loads(json_str)
                        return json.dumps(parsed_json, ensure_ascii=False)
                    except:
                        pass
                
                # If all attempts fail, return the original response
                return result
                
        except Exception as inner_e:
            print(f"Fallback error: {str(inner_e)}")
            raise Exception(f"Failed to generate questions: {str(e)}, Fallback error: {str(inner_e)}")

def generate_english_kisi_kisi(data, questions_data):
    # Format required fields for kisi-kisi generation
    system_prompt = """
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
    
    Berikan output dalam format JSON yang terstruktur seperti berikut:
    
    {
      "kisi_kisi": {
        "informasi": {
          "nama_sekolah": "string (gunakan data dari RPP)",
          "mata_pelajaran": "Bahasa Inggris",
          "kelas_semester": "string",
          "kurikulum": "Merdeka",
          "alokasi_waktu": "string (gunakan data dari soal)",
          "jumlah_bentuk_soal": "string (jumlah dan jenis soal, mis: 5 PG, 5 Menjodohkan, 5 B-S, 2 Essay)",
          "penulis": "string (gunakan data dari RPP)",
          "tahun_pelajaran": "2024/2025",
          "tempat_tanggal": "string (lokasi dan tanggal)"
        },
        "tabel_kisi_kisi": [
          {
            "nomor": 1,
            "tujuan_pembelajaran": "string (dari RPP)",
            "materi": "string (dari RPP)",
            "indikator_soal": "string (deskripsikan kemampuan yang diuji)",
            "level_kognitif": "string (C1-C6)",
            "bentuk_soal": "string (PG/Menjodohkan/B-S/Essay)",
            "nomor_soal": "string (nomor soal dalam kelompoknya)"
          },
          // tambahkan untuk semua soal yang dibuat
        ]
      }
    }
    
    Pastikan semua informasi lengkap, akurat, dan sesuai dengan standar kurikulum Merdeka di Indonesia.
    """

    user_prompt = f"""
    Buatlah kisi-kisi penulisan soal untuk asesmen bahasa Inggris berdasarkan data berikut:
    
    RPP (Rencana Pelaksanaan Pembelajaran):
    Mata Pelajaran: {data.get('mata_pelajaran')}
    Jenjang: {data.get('jenjang')}
    Kelas: {data.get('kelas')}
    Alokasi Waktu: {data.get('alokasi_waktu', '90 menit')}
    Konten Utama: {data.get('konten_utama')}
    Tujuan Pembelajaran: {data.get('tujuan_pembelajaran')}
    Nama Penyusun: {data.get('nama_penyusun', 'Guru Bahasa Inggris')}
    
    Soal yang telah dibuat:
    Judul Soal: {questions_data.get('judul', 'Soal Evaluasi Bahasa Inggris')}
    - Pilihan Ganda: 5 soal
    - Menjodohkan: 5 soal
    - Benar-Salah: 5 soal
    - Essay: 2 soal
    
    Buatlah kisi-kisi yang memuat informasi dan tabel kisi-kisi sesuai format yang diminta.
    Pastikan setiap jenis soal memiliki entri dalam tabel kisi-kisi dan level kognitif bervariasi sesuai dengan jenis soal.
    """

    full_prompt = system_prompt + "\n\n" + user_prompt

    try:
        # Create a Gemini model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Generate content with Gemini
        response = model.generate_content(full_prompt)
        
        result = response.text
        
        # Clean the response - remove any markdown code block formatting or extra text
        result = re.sub(r'```json\s*', '', result)
        result = re.sub(r'```\s*', '', result)
        
        # Try to parse JSON to verify its validity
        try:
            parsed_json = json.loads(result)
            # Return the properly formatted JSON string
            return json.dumps(parsed_json, ensure_ascii=False)
        except json.JSONDecodeError:
            # If the response isn't valid JSON, try to extract JSON using regex
            json_match = re.search(r'({.*})', result, re.DOTALL)
            if json_match:
                try:
                    json_str = json_match.group(1)
                    parsed_json = json.loads(json_str)
                    return json.dumps(parsed_json, ensure_ascii=False)
                except:
                    pass
            
            # If all attempts fail, return the original response
            return result
            
    except Exception as e:
        print(f"Error generating kisi-kisi: {str(e)}")
        # Try fallback to another model
        try:
            model = genai.GenerativeModel('gemini-1.5-pro')
            
            response = model.generate_content(full_prompt)
            
            result = response.text
            
            # Clean the response - remove any markdown code block formatting
            result = re.sub(r'```json\s*', '', result)
            result = re.sub(r'```\s*', '', result)
            
            # Try to parse JSON to verify its validity
            try:
                parsed_json = json.loads(result)
                return json.dumps(parsed_json, ensure_ascii=False)
            except json.JSONDecodeError:
                # If the response isn't valid JSON, try to extract JSON using regex
                json_match = re.search(r'({.*})', result, re.DOTALL)
                if json_match:
                    try:
                        json_str = json_match.group(1)
                        parsed_json = json.loads(json_str)
                        return json.dumps(parsed_json, ensure_ascii=False)
                    except:
                        pass
                
                # If all attempts fail, return the original response
                return result
                
        except Exception as inner_e:
            print(f"Fallback error: {str(inner_e)}")
            raise Exception(f"Failed to generate kisi-kisi: {str(e)}, Fallback error: {str(inner_e)}")

@app.route("/", methods=["GET"])
def index():
    return render_template("english_index.html")

@app.route("/generate-english", methods=["POST"])
def generate():
    try:
        # Get form data
        data = {
            "nama_penyusun": request.form.get("nama_penyusun"),
            "institusi": request.form.get("institusi"),
            "tahun_pembuatan": request.form.get("tahun_pembuatan"),
            "mata_pelajaran": request.form.get("mata_pelajaran"),
            "jenjang": request.form.get("jenjang"),
            "kelas": request.form.get("kelas"),
            "alokasi_waktu": request.form.get("alokasi_waktu"),
            "tahapan": request.form.get("tahapan"),
            "capaian_pembelajaran": request.form.get("capaian_pembelajaran"),
            "domain_konten": request.form.get("domain_konten"),
            "tujuan_pembelajaran": request.form.get("tujuan_pembelajaran"),
            "konten_utama": request.form.get("konten_utama"),
            "prasyarat": request.form.get("prasyarat"),
            "pemahaman_bermakna": request.form.get("pemahaman_bermakna"),
            "profil_pelajar": request.form.get("profil_pelajar"),
            "sarana": request.form.get("sarana"),
            "target_peserta": request.form.get("target_peserta"),
            "jumlah_peserta": request.form.get("jumlah_peserta"),
            "model_pembelajaran": request.form.get("model_pembelajaran"),
            "sumber_belajar": request.form.get("sumber_belajar"),
            "catatan": request.form.get("catatan")
        }
        
        # Save user input data to JSON
        save_to_json(data, "user_input")
        
        result = generate_english_lesson(data)
        
        # Validate that the result is proper JSON
        try:
            # Try to parse the JSON to make sure it's valid
            json_data = json.loads(result)
            
            # Save generated RPP to JSON file
            save_to_json(json_data, "rpp")
            
            return jsonify({"status": "success", "rpp": json.dumps(json_data, ensure_ascii=False)})
        except json.JSONDecodeError:
            return jsonify({"status": "error", "message": "Model menghasilkan respons yang tidak valid. Silakan coba lagi."})
            
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route("/generate-bahan-ajar", methods=["POST"])
def generate_bahan_ajar_route():
    try:
        # Get JSON data from request
        data = request.json
        
        # Generate bahan ajar
        result = generate_bahan_ajar(data)
        
        # Try to parse the result as JSON
        try:
            json_data = json.loads(result)
            
            # Save bahan ajar to JSON file
            save_to_json(json_data, "bahan_ajar")
            
            return jsonify({"status": "success", "bahan_ajar": json.dumps(json_data, ensure_ascii=False)})
        except json.JSONDecodeError:
            # Even if it's not valid JSON, we'll try to save it
            save_to_json({"raw_text": result}, "bahan_ajar")
            return jsonify({"status": "success", "bahan_ajar": result})
            
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route("/view-english-rpp", methods=["POST"])
def view_rpp():
    try:
        # Get the RPP JSON data from form
        rpp_json = request.form.get("rpp_data")
        
        # Parse the JSON data
        rpp_data = json.loads(rpp_json)
        
        # Render a dedicated template for the RPP
        return render_template("english_rpp_view.html", rpp=rpp_data.get('rpp_bahasa_inggris', {}))
    except Exception as e:
        return render_template("error.html", error=str(e))

@app.route("/generate-english-questions", methods=["POST"])
def generate_questions():
    try:
        # Get JSON data from request
        data = request.json
        
        # Generate questions
        result = generate_english_questions(data)
        
        # Try to parse the result as JSON
        try:
            json_data = json.loads(result)
            
            # Save questions to JSON file
            save_to_json(json_data, "questions")
            
            return jsonify({"status": "success", "questions": json.dumps(json_data, ensure_ascii=False)})
        except json.JSONDecodeError:
            # Even if it's not valid JSON, we'll try to save it
            save_to_json({"raw_text": result}, "questions")
            return jsonify({"status": "success", "questions": result})
            
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route("/view-english-questions", methods=["POST"])
def view_questions():
    try:
        # Get the questions JSON data from form
        questions_json = request.form.get("questions_data")
        
        # Parse the JSON data
        questions_data = json.loads(questions_json)
        
        # Render a dedicated template for the questions
        return render_template("english_questions_view.html", questions=questions_data.get('soal_bahasa_inggris', {}))
    except Exception as e:
        return render_template("error.html", error=str(e))

@app.route("/generate-english-kisi-kisi", methods=["POST"])
def generate_kisi_kisi():
    try:
        # Get JSON data from request
        data = request.json
        rpp_data = data.get('rpp_data', {})
        questions_data = data.get('questions_data', {})
        
        # Generate kisi-kisi
        result = generate_english_kisi_kisi(rpp_data, questions_data)
        
        # Try to parse the result as JSON
        try:
            json_data = json.loads(result)
            
            # Save kisi-kisi to JSON file
            save_to_json(json_data, "kisi_kisi")
            
            return jsonify({"status": "success", "kisi_kisi": json.dumps(json_data, ensure_ascii=False)})
        except json.JSONDecodeError:
            # Even if it's not valid JSON, we'll try to save it
            save_to_json({"raw_text": result}, "kisi_kisi")
            return jsonify({"status": "success", "kisi_kisi": result})
            
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route("/view-english-kisi-kisi", methods=["POST"])
def view_kisi_kisi():
    try:
        # Get the kisi-kisi JSON data from form
        kisi_kisi_json = request.form.get("kisi_kisi_data")
        
        # Parse the JSON data
        kisi_kisi_data = json.loads(kisi_kisi_json)
        
        # Render a dedicated template for the kisi-kisi
        return render_template("english_kisi_kisi_view.html", kisi_kisi=kisi_kisi_data.get('kisi_kisi', {}))
    except Exception as e:
        return render_template("error.html", error=str(e))

if __name__ == "__main__":
    print("Starting Flask server for English Learning Module Generator...")
    app.run(debug=True) 
