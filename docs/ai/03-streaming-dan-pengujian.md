# 3. Streaming agent dan pengujian tanpa frontend

## Tujuan

Frontend nanti dapat menampilkan progres tool, jawaban AI, dan draft berdasarkan event SSE. Sebelum frontend tersedia, gunakan klien terminal.

## Cara menjalankan

1. Jalankan `npm run dev` di terminal pertama; agent memakai mock otomatis di development.
2. Jalankan `npm run chat:cli` di terminal kedua.
3. Ketik contoh aduan. Amati status proses dan jawaban, lalu ketik `/quit` untuk keluar.

Jika server berjalan pada alamat lain, tentukan `ADUAI_URL` untuk klien terminal. Di PowerShell: `$env:ADUAI_URL = 'http://localhost:3217'`.

## Kontrak SSE

Frontend mengirim `POST /api/chat` menggunakan `fetch` dengan pesan dan draft. Respons `text/event-stream` membawa `runId` dan urutan `seq`. Untuk contoh payload lengkap, lihat PRD bagian 7.1.1.

| Event | Tampilan yang disarankan |
|---|---|
| `run.started` | Tampilkan proses AI dimulai. |
| `step.started` | Tampilkan label langkah dan simpan `toolCallId`. |
| `step.completed` / `step.failed` | Perbarui langkah yang sesuai `toolCallId`. |
| `reply.delta` | Tambahkan teks jawaban. |
| `draft.updated` | Perbarui draft lokal. |
| `done` | Gunakan jawaban dan draft final; aktifkan kembali input. |
| `error` | Tampilkan pesan aman dan opsi ulang bila dapat dicoba lagi. |

Jika koneksi putus sebelum `done` atau `error`, tandai jawaban belum selesai dan izinkan coba ulang. Jangan tampilkan prompt sistem, argumen tool mentah, atau penalaran internal.

## Kondisi saat ini

Endpoint `src/app/api/chat/route.ts` dan klien `scripts/chat-cli.mjs` sudah ada. Saat ini provider ditunggu sampai selesai, kemudian jawaban dikirim dalam satu event `reply.delta`; ini **belum** streaming token dari provider. Mode mock menguji mekanisme loop, bukan kualitas model.

## Daftar uji

- Pastikan urutan event mulai → langkah tool → hasil → `done`.
- Coba body tidak valid dan pastikan server mengembalikan HTTP 400.
- Coba provider belum disetel dan pastikan event `error` tidak membocorkan secret.
- Coba koneksi terputus dan pembatalan; pastikan klien tidak menganggap respons parsial sebagai jawaban final.
- Jalankan `npm run lint`, `npm run typecheck`, dan `npm run build`.


