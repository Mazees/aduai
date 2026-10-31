# 6. Kontrak integrasi dengan backend

**Status: direncanakan; bukan implementasi yang sudah selesai.**

## Setelah pengadu mengonfirmasi

1. Frontend mengirim draft yang dikonfirmasi ke endpoint backend pembuatan laporan.
2. Backend memvalidasi deskripsi dan WhatsApp, melakukan penyamaran identitas untuk data admin, serta membuat tiket dan kode akses secara idempoten.
3. Backend mengembalikan tiket kepada pengadu dan mencatat satu pekerjaan evaluasi.
4. Evaluation worker memproses percakapan yang disediakan sementara. Penyimpanan sementara, TTL, retry, dan akses perlu disepakati bersama Dimas.
5. Kegagalan evaluasi tidak membatalkan tiket.

## Antarmuka yang dibutuhkan flow AI

| Kebutuhan | Penyedia | Catatan |
|---|---|---|
| Pembuatan dan pelacakan laporan | Backend | AI tidak menulis status; akses pelacakan diverifikasi. |
| Evaluasi dan persona aktif | Backend | Menyimpan hasil tanpa identitas dan mendukung retry idempoten. |
| Knowledge dan vector search | Backend + AI | Hanya sumber resmi yang dipublikasikan. |
| Perubahan status, bukti, WhatsApp | Backend | Tidak menjadi wewenang AI. |
| Tampilan progres SSE | Frontend | Gunakan event dan payload di PRD. |

## Sebelum integrasi

- Sepakati bentuk request/response, validasi, error, dan pemilik masing-masing API.
- Pastikan endpoint admin tidak mengirim nomor WhatsApp atau chat mentah.
- Jangan mengandalkan background task dalam memori tetap hidup setelah respons serverless selesai.
- Uji kehilangan data sementara, retry, permintaan ganda, dan kegagalan provider.

