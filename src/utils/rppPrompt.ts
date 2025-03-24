import { CreateRppInput } from "src/rpp/dto/create-rpp.input";

export function generateRppPrompt(input: CreateRppInput): string {
    return `
    Buatkan **Rencana Pelaksanaan Pembelajaran (RPP)** sesuai dengan **Kurikulum Merdeka** dari **Kemendikbud Indonesia** untuk **mata pelajaran ${input.mataPelajaran}**, kelas **${input.kelas}** SD, **Fase ${input.fase}**, dengan **topik "${input.topik}"** yang mencakup materi **(${input.cakupanMateri})**.  

    RPP ini harus mencakup seluruh komponen penting dan disusun dalam format JSON yang **terstruktur, detail, dan lengkap**.  

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