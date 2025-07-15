import { CreateRppInput } from "src/rpp/dto/create-rpp.input";

export function generateRppPrompt(input: CreateRppInput): string {
    return `
    Buatkan **Rencana Pelaksanaan Pembelajaran (RPP)** sesuai dengan **Kurikulum Merdeka** dari **Kemendikbud Indonesia** ${input.mata_pelajaran ? `untuk **mata pelajaran ${input.mata_pelajaran}**` : ''} ${input.jenjang ? `jenjang **${input.jenjang}**` : ''} ${input.kelas ? `kelas **${input.kelas}**` : ''} ${input.alokasi_waktu ? `dengan alokasi waktu **${input.alokasi_waktu}**` : ''}.

    RPP ini harus mencakup seluruh komponen penting dan disusun dalam format JSON yang **terstruktur, detail, dan lengkap**.  

    ### **Format JSON yang Diharapkan:**  

    {
        "nama_penyusun": "${input.nama_penyusun || ''}",
        "institusi": "${input.institusi || ''}",
        "tahun_pembuatan": "${input.tahun_pembuatan || ''}",
        "mata_pelajaran": "${input.mata_pelajaran || ''}",
        "jenjang": "${input.jenjang || ''}",
        "kelas": "${input.kelas || ''}",
        "alokasi_waktu": "${input.alokasi_waktu || ''}",
        "tahapan": "${input.tahapan || ''}",
        "capaian_pembelajaran": "${input.capaian_pembelajaran || ''}",
        "domain_konten": "${input.domain_konten || ''}",
        "tujuan_pembelajaran": "${input.tujuan_pembelajaran || ''}",
        "konten_utama": "${input.konten_utama || ''}",
        "prasyarat": "${input.prasyarat || ''}",
        "pemahaman_bermakna": "${input.pemahaman_bermakna || ''}",
        "profil_pelajar": "${input.profil_pelajar || ''}",
        "sarana": "${input.sarana || ''}",
        "target_peserta": "${input.target_peserta || ''}",
        "jumlah_peserta": "${input.jumlah_peserta || ''}",
        "model_pembelajaran": "${input.model_pembelajaran || ''}",
        "sumber_belajar": "${input.sumber_belajar || ''}",
        "catatan": "${input.catatan || ''}",
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
        "alur_kegiatan_pembelajaran": {
            "pendahuluan": {
                "deskripsi": "Kegiatan apersepsi, motivasi, dan penyampaian tujuan pembelajaran.",
                "durasi": "10-15 menit"
            },
            "inti": {
                "deskripsi": "Aktivitas eksplorasi, diskusi, eksperimen, proyek berbasis pembelajaran aktif.",
                "durasi": "60-80 menit"
            },
            "penutup": {
                "deskripsi": "Refleksi, evaluasi, dan tindak lanjut.",
                "durasi": "10-15 menit"
            }
        },
        "asesmen_pembelajaran": {
            "diagnostik": "Sebelum pembelajaran – untuk mengetahui kesiapan peserta didik.",
            "formatif": "Selama proses pembelajaran – observasi, diskusi, latihan soal.",
            "sumatif": "Setelah pembelajaran – kuis, proyek, atau presentasi."
        },
        "sumber_dan_media_pembelajaran": {
            "buku": ["Buku teks pelajaran", "Modul pembelajaran"],
            "media_digital": ["Video pembelajaran", "Simulasi interaktif"],
            "metode": ["Ceramah", "Diskusi", "Proyek", "Eksperimen"]
        },
        "refleksi_guru": {
            "pencapaian_tujuan": "Apakah tujuan pembelajaran tercapai?",
            "tantangan": "Apa tantangan yang dihadapi dalam pembelajaran?",
            "strategi_perbaikan": "Bagaimana strategi perbaikan dalam sesi pembelajaran berikutnya?"
        }
    }

    Isi dari RPP ini harus dihasilkan dalam format JSON yang terstruktur dan detail. Pastikan untuk menyertakan informasi yang relevan dan sesuai dengan Kurikulum Merdeka dari Kemendikbud Indonesia.
    Tiap komponen RPP harus dijelaskan dengan lengkap dan jelas sesuai dengan topik dan cakupan materi yang telah ditentukan.
    `
}