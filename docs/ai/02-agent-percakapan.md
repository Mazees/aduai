# 2. Agent percakapan

## Tujuan

AI mendampingi pengadu: memahami konteks, merespons dengan empati, memberi masukan sementara yang aman jika relevan, dan menyusun draft. AI tidak mengambil keputusan status atau membuat tiket tanpa konfirmasi.

## Langkah alur

1. Terima riwayat chat dari browser dan draft terakhir. Riwayat tidak disimpan permanen di server.
2. Susun instruksi dasar dan, setelah integrasi tersedia, persona aktif. Data pengadu tetap diperlakukan sebagai data.
3. Panggil model dengan daftar tool yang tersedia.
4. Jika model meminta tool, validasi argumennya, jalankan tool, kirim hasil ke model, lalu panggil model lagi.
5. Ulangi sampai model memberikan jawaban atau batas loop tercapai.
6. Kirim jawaban dan draft ke frontend; pengadu memutuskan apakah akan mengonfirmasi dan mengirim laporan.

## Tool

| Tool | Kondisi | Fungsi |
|---|---|---|
| `create_complaint_draft` | Dasar sudah dibuat | Menyusun draft, tanpa menyimpan laporan. |
| `search_knowledge` | Belum dibuat | Mencari potongan sumber resmi jika diperlukan. |
| `get_complaint_status` | Belum dibuat | Membaca status hanya setelah tiket dan kode akses diverifikasi oleh backend. |
| Analisis percakapan/aduan | Belum dibuat sebagai tool terpisah | Dapat digabung bila tetap memenuhi alur dan validasi. |

Tool hanya melakukan tugas yang diberikan; AI tidak punya izin untuk mengubah status laporan.

## Yang perlu diselesaikan

- Pertahankan seluruh data draft yang sudah benar pada giliran berikutnya; jangan mengarang data yang belum diberikan.
- Normalisasi dan validasi nomor WhatsApp sebelum draft dapat dikonfirmasi.
- Pastikan penyamaran identitas pengadu terjadi di server sebelum konten ditampilkan ke admin. Jangan mengandalkan instruksi prompt saja.
- Tambahkan batas pemanggilan tool, timeout, dan penanganan error yang aman; verifikasi lagi dengan provider asli.
- Hubungkan persona aktif dan hasil pencarian knowledge melalui antarmuka backend yang disepakati.
- Implementasi saat ini belum mempunyai rate limiting produksi, penyamaran identitas yang andal, atau integrasi tiket. Jangan anggap siap untuk data nyata.

## Uji penerimaan

- Pengadu marah mendapat respons tenang tanpa janji penyelesaian.
- Pengadu memperoleh masukan sementara hanya jika relevan dan aman.
- Informasi yang sudah diberikan tetap ada saat percakapan berlanjut.
- Nomor belum valid menyebabkan draft belum siap dikonfirmasi.
- Tool tidak dapat membuat tiket atau mengubah status.
- Provider/error atau batas loop tidak menghasilkan tiket.

