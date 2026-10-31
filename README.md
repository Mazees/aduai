# AduAI

Aplikasi pengaduan masyarakat berbasis Next.js. Modul AI menerima dependency backend secara eksplisit: provider, chat streaming, draft, Main Knowledge, knowledge dan evaluasi persona. POST /api/chat mengembalikan 503 sampai backend dihubungkan. Panduan: [integrasi tim](docs/ai/README.md).

## Menjalankan proyek

Persyaratan: Node.js 20.9 atau lebih baru dan npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Di PowerShell, gunakan `Copy-Item .env.example .env.local` untuk menyalin konfigurasi. Buka http://localhost:3000.

```bash
npm run lint
npm run typecheck
npm run build
```

## Struktur

- `src/app`: halaman dan Route Handlers Next.js.
- `src/features`: kode berdasarkan domain aduan, chat, admin, knowledge, dan notifikasi.
- `src/lib`: integrasi bersama yang hanya dipakai di server atau browser sesuai kebutuhan.
- `src/types`: kontrak data bersama.
- `supabase/migrations`: migrasi database.
- `docs`: kontrak implementasi dan pembagian pekerjaan.

Setiap fitur dikerjakan sesuai PRD. Jangan menyimpan chat secara permanen atau mengekspos nomor WhatsApp pada API admin. Jangan taruh service role key di variabel `NEXT_PUBLIC_`.

## Pembagian pekerjaan

- Mada: alur AI dan evaluasi persona.
- Dimas: backend, database, penyimpanan bukti, autentikasi, dan WhatsApp.
- Cahya: antarmuka pengadu dan admin.

Tidak ada layanan eksternal yang diperlukan untuk menjalankan kerangka awal. Isi `.env.local` ketika integrasi terkait mulai dikembangkan. Variabel contoh tidak berisi kredensial.
