# Panduan AI AduAI

Dokumen ini menjadi halaman awal untuk Mada, Dimas, dan Cahya. Kontrak produk tetap mengacu pada [PRD](../PRD-AduAI-NextJS.md).

## Urutan baca

| No. | Dokumen | Isi | Pembaca utama |
|---|---|---|---|
| 01 | [Provider](01-provider.md) | Konfigurasi server dan adapter OpenAI-compatible. | Dimas |
| 02 | [Agent percakapan](02-agent-percakapan.md) | Loop model/tool, draft, privasi, dan Main Knowledge. | Semua |
| 03 | [API dan streaming](03-api-streaming.md) | Validasi HTTP, factory handler, SSE, dan error. | Dimas, Cahya |
| 04 | [Konfirmasi pengiriman](04-konfirmasi-pengiriman.md) | Persetujuan, submit, idempotensi, receipt, dan callback evaluasi. | Dimas, Cahya |
| 05 | [Knowledge dan vector](05-knowledge-vector.md) | Embedding 384 dimensi, indexing, dan repository pencarian. | Dimas |
| 06 | [Evaluasi dan persona](06-evaluasi-persona.md) | Evaluasi otomatis, deduplikasi, dan positive/negative prompt. | Dimas |
| 07 | [Backend Dimas](07-backend-dimas.md) | Contoh wiring services.ts, kontrak service, dan worker. | Dimas |
| 08 | [Frontend Cahya](08-frontend-cahya.md) | Payload, pembaca SSE, state tampilan, retry, dan dashboard. | Cahya |
| 09 | [Pengujian](09-pengujian.md) | Skenario sebelum/sesudah backend terhubung. | Semua |

## Mulai sesuai tugas

- **Dimas:** mulai dari 07, lalu lihat rincian fitur 01-06. Isi `getAiServices()` pada `src/lib/ai/services.ts`, pasok service backend serta callback antrean evaluasi, lalu uji dengan 09.
- **Cahya:** mulai dari 08, lalu baca kontrak streaming 03 dan konfirmasi 04. Gunakan tipe bersama dari src/types; halaman provider/Main Knowledge mengikuti API admin pada PRD.
- **Mada:** memelihara flow agent, adapter provider, validasi/injeksi Main Knowledge, embedding, evaluasi, handler HTTP, dan kontrak bersama.

## Status implementasi

Flow AI, provider, draft, handler SSE, Main Knowledge, embedding, dan evaluation agent tersedia. POST /api/chat mengembalikan HTTP 503 AI_INTEGRATION_NOT_CONFIGURED sampai service Dimas dihubungkan. Tidak ada CLI, adapter data sementara, pembaca konfigurasi JSON, atau endpoint evaluasi pengujian dalam aplikasi.

File JSON privat lama hanya backup dan tetap diabaikan Git. Semua data/provider dikirim service backend secara eksplisit. Chat disimpan di browser dan dipakai sementara oleh server; WhatsApp tidak boleh tampil pada API/halaman admin.

Database/SQL, tiket, autentikasi, worker, deployment, dan WhatsApp dikerjakan Dimas. Seluruh halaman dikerjakan Cahya. Modul AI ini tidak menyediakan implementasi backend operasional atau frontend.
