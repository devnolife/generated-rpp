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

def generate_module_ajar(data):
    
    # Format multi-point inputs
    atp_items = data.get('atp', [])
    atp_formatted = "\n".join([f"- {item}" for item in atp_items if item])
    
    element_items = data.get('element', [])
    element_formatted = "\n".join([f"- {item}" for item in element_items if item])
    
    materi_items = data.get('materi', [])
    materi_formatted = "\n".join([f"- {item}" for item in materi_items if item])
    
    prompt = f"""
    Anda adalah asisten AI yang ahli dalam menyusun Rencana Pelaksanaan Pembelajaran (RPP) untuk mata pelajaran sekolah dasar (SD). 
    Tugas Anda adalah menghasilkan dokumen RPP yang lengkap dan terstruktur berdasarkan peraturan Kemendikbud tentang kurikulum merdeka.
    
    Gunakan data berikut untuk membuat RPP:
    - Kelas: {data['kelas']}
    - Semester: {data['semester']}
    - Mata Pelajaran: {data['mata_pelajaran']}
    - Pertemuan: {data['pertemuan']}
    - Tema: {data['tema']}
    - Sub Tema: {data['sub_tema']}
    
    Alur Tujuan Pembelajaran (ATP):
    {atp_formatted}
    
    Element:
    {element_formatted}
    
    Materi:
    {materi_formatted}
    
    Hasilkan RPP lengkap dengan isi untuk setiap bagian berikut:
    1. Satuan Pendidikan (tentukan sekolah yang sesuai untuk kelas tersebut)
    2. Kompetensi Dasar (KD) untuk KI-1, KI-2, KI-3, dan KI-4 yang sesuai dengan mata pelajaran dan tema
    3. Indikator Pencapaian Kompetensi (IPK) untuk setiap KD
    4. Tujuan Pembelajaran (minimal 3, yang harus mencerminkan ATP yang diberikan)
    5. Materi Pembelajaran Reguler (minimal 3 poin, yang harus mencakup semua materi yang diberikan)
    6. Materi Pembelajaran Remedial dan Pengayaan
    7. Metode Pembelajaran (model, pendekatan, dan metode yang sesuai dengan element pembelajaran yang diberikan)
    8. Media/Alat, Bahan, dan Sumber Belajar
    9. Langkah-langkah kegiatan pembelajaran (kegiatan pendahuluan, inti, dan penutup)
    10. Penilaian (teknik dan instrumen penilaian sikap, pengetahuan, dan keterampilan)
    11. Pembelajaran Remedial dan Pengayaan
    
    PENTING: Berikan output dalam format JSON lengkap. Pastikan output HANYA berisi JSON tanpa tag backtick atau tambahan apapun.
    """

    system_prompt = """
    {
  "rpp": {
    "identitas": {
      "satuan_pendidikan": "(sekolah yang sesuai)",
      "kelas_semester": "(kelas)/(semester)",
      "mata_pelajaran": "(mata pelajaran)",
      "tema": "(tema)",
      "sub_tema": "(sub tema)",
      "pertemuan_ke": "(pertemuan)",
      "alokasi_waktu": "(durasi yang sesuai) JP"
    },
    "kompetensi_inti": {
      "ki_1": "Menerima dan menjalankan ajaran agama yang dianutnya.",
      "ki_2": "Menunjukkan perilaku jujur, disiplin, tanggung jawab, santun, peduli, dan percaya diri dalam berinteraksi dengan keluarga, teman, guru, dan tetangganya.",
      "ki_3": "Memahami pengetahuan faktual dengan cara mengamati [mendengar, melihat, membaca] dan menanya berdasarkan rasa ingin tahu tentang dirinya, makhluk ciptaan Tuhan dan kegiatannya, dan benda-benda yang dijumpainya di rumah dan di sekolah.",
      "ki_4": "Menyajikan pengetahuan faktual dalam bahasa yang jelas, sistematis dan logis, dalam karya yang estetis, dalam gerakan yang mencerminkan anak sehat, dan dalam tindakan yang mencerminkan perilaku anak beriman dan berakhlak mulia."
    },
    "kompetensi_dasar_dan_indikator": {
      "kompetensi_dasar": {
        "ki_1": "(KD untuk KI-1)",
        "ki_2": "(KD untuk KI-2)",
        "ki_3": "(KD untuk KI-3)",
        "ki_4": "(KD untuk KI-4)"
      },
      "indikator_pencapaian_kompetensi": {
        "ki_1": "(indikator untuk KD pada KI-1)",
        "ki_2": "(indikator untuk KD pada KI-2)",
        "ki_3": "(indikator untuk KD pada KI-3)",
        "ki_4": "(indikator untuk KD pada KI-4)"
      }
    },
    "tujuan_pembelajaran": [
      "(tujuan pembelajaran 1)",
      "(tujuan pembelajaran 2)",
      "(tujuan pembelajaran 3)"
    ],
    "materi_pembelajaran": {
      "reguler": [
        "(materi reguler 1)",
        "(materi reguler 2)",
        "(materi reguler 3)"
      ],
      "remedial": [
        "(materi remedial)"
      ],
      "pengayaan": [
        "(materi pengayaan)"
      ]
    },
    "metode_pembelajaran": {
      "model_pembelajaran": "(model pembelajaran)",
      "pendekatan": "(pendekatan pembelajaran)",
      "metode": "(metode pembelajaran)"
    },
    "media_alat_bahan_sumber": {
      "media_alat": [
        "(media/alat 1)",
        "(media/alat 2)"
      ],
      "bahan": [
        "(bahan 1)",
        "(bahan 2)"
      ],
      "sumber_belajar": [
        "(sumber belajar 1)",
        "(sumber belajar 2)"
      ]
    },
    "langkah_langkah_kegiatan_pembelajaran": {
      "pertemuan_ke": "(pertemuan) (... JP)",
      "kegiatan_pendahuluan": {
        "durasi": "(menit)",
        "kegiatan": [
          "Guru menyapa siswa dan mengondisikan kelas.",
          "Guru mengajak siswa berdoa bersama.",
          "Guru mengecek kehadiran siswa.",
          "Guru melakukan apersepsi.",
          "Guru menyampaikan tujuan pembelajaran.",
          "Guru menyampaikan rencana kegiatan."
        ]
      },
      "kegiatan_inti": {
        "durasi": "(menit)",
        "kegiatan": {
          "mengamati": [
            "(kegiatan mengamati 1)",
            "(kegiatan mengamati 2)"
          ],
          "menanya": [
            "(kegiatan menanya 1)",
            "(kegiatan menanya 2)"
          ],
          "mengumpulkan_informasi_eksperimen": [
            "(kegiatan mengumpulkan informasi 1)",
            "(kegiatan mengumpulkan informasi 2)"
          ],
          "mengasosiasi_mengolah_informasi": [
            "(kegiatan mengasosiasi 1)",
            "(kegiatan mengasosiasi 2)"
          ],
          "mengomunikasikan": [
            "(kegiatan mengomunikasikan 1)",
            "(kegiatan mengomunikasikan 2)"
          ]
        }
      },
      "kegiatan_penutup": {
        "durasi": "(menit)",
        "kegiatan": [
          "Bersama siswa, guru membuat kesimpulan/rangkuman hasil belajar.",
          "Guru melakukan penilaian dan refleksi terhadap kegiatan yang sudah dilaksanakan.",
          "Guru memberikan umpan balik terhadap proses dan hasil pembelajaran.",
          "Guru memberikan tugas sebagai tindak lanjut.",
          "Guru menyampaikan rencana pembelajaran pada pertemuan berikutnya.",
          "Guru menutup pelajaran dengan doa dan salam."
        ]
      }
    },
    "penilaian_pembelajaran_remedial_dan_pengayaan": {
      "teknik_penilaian": {
        "penilaian_sikap": [
          "Observasi: (teknik observasi)",
          "Penilaian diri: (teknik penilaian diri)",
          "Penilaian antar teman: (teknik penilaian antar teman)"
        ],
        "penilaian_pengetahuan": [
          "Tes tertulis: (teknik tes tertulis)",
          "Tes lisan: (teknik tes lisan)",
          "Penugasan: (teknik penugasan)"
        ],
        "penilaian_keterampilan": [
          "Praktik/Kinerja: (teknik penilaian praktik)",
          "Proyek: (teknik penilaian proyek)",
          "Portofolio: (teknik penilaian portofolio)"
        ]
      },
      "instrumen_penilaian": [
        "Lembar observasi: (instrumen observasi)",
        "Soal tes tertulis: (instrumen tes tertulis)",
        "Lembar penilaian kinerja: (instrumen penilaian kinerja)"
      ],
      "pembelajaran_remedial_dan_pengayaan": {
        "remedial": "(kegiatan remedial)",
        "pengayaan": "(kegiatan pengayaan)"
      }
    },
    "lampiran": [
      "Materi Pembelajaran",
      "Instrumen Penilaian",
      "Media Pembelajaran",
      "Lembar Kerja Peserta Didik"
    ],
    "mengetahui": {
      "kepala_sekolah": "_________________",
      "guru_mata_pelajaran": "_________________",
      "nip_kepala_sekolah": "NIP.",
      "nip_guru_mata_pelajaran": "NIP."
    }
  }
}
    """

    try:
        # Create a Gemini model
        model = genai.GenerativeModel('gemini-1.5-flash')
        
        # Generate content with Gemini
        response = model.generate_content(
            [
                {"role": "user", "parts": [{"text": system_prompt + "\n\n" + prompt}]}
            ]
        )
        
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
            available_models = [m.name for m in genai.list_models()]
            print(f"Available models: {available_models}")
            
            if 'gemini-pro' in available_models:
                model = genai.GenerativeModel('gemini-pro')
            elif any('gemini' in m for m in available_models):
                model_name = next(m for m in available_models if 'gemini' in m)
                model = genai.GenerativeModel(model_name)
            else:
                raise Exception("No suitable Gemini model found")
                
            response = model.generate_content(
                [
                    {"role": "user", "parts": [{"text": system_prompt + "\n\n" + prompt}]}
                ]
            )
            
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

@app.route("/", methods=["GET"])
def index():
    return render_template("index.html")

@app.route("/generate", methods=["POST"])
def generate():
    try:
        # Get form data
        data = {
            "kelas": request.form.get("kelas"),
            "semester": request.form.get("semester"),
            "mata_pelajaran": request.form.get("mata_pelajaran"),
            "pertemuan": request.form.get("pertemuan"),
            "tema": request.form.get("tema"),
            "sub_tema": request.form.get("sub_tema"),
            "atp": request.form.getlist("atp[]"),
            "element": request.form.getlist("element[]"),
            "materi": request.form.getlist("materi[]")
        }
        
        result = generate_module_ajar(data)
        
        # Validate that the result is proper JSON
        try:
            # Try to parse the JSON to make sure it's valid
            json_data = json.loads(result)
            return jsonify({"status": "success", "module": json.dumps(json_data, ensure_ascii=False)})
        except json.JSONDecodeError:
            return jsonify({"status": "error", "message": "Model menghasilkan respons yang tidak valid. Silakan coba lagi."})
            
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})

@app.route("/view-rpp", methods=["POST"])
def view_rpp():
    try:
        # Get the RPP JSON data from form
        rpp_json = request.form.get("rpp_data")
        
        # Parse the JSON data
        rpp_data = json.loads(rpp_json)
        
        # Render a dedicated template for the RPP
        return render_template("rpp_view.html", rpp=rpp_data.get('rpp', {}))
    except Exception as e:
        return render_template("error.html", error=str(e))

if __name__ == "__main__":
    print("Starting Flask server...")
    app.run(debug=True)