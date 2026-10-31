# Pengujian flow AI tanpa frontend

1. Buka terminal di folder proyek dan jalankan `npm run dev`.
2. Buka terminal kedua dan jalankan `npm run chat:cli`.
3. Ketik contoh aduan. Terminal menampilkan langkah tool dan jawaban. Ketik `/quit` untuk keluar.

Untuk saat ini agent otomatis memakai fallback mock di development tanpa environment variable. Mock hanya menguji alur loop dan SSE, bukan kualitas atau empati model. Production tidak memakai fallback mock.

Halaman dan backend konfigurasi provider belum diimplementasikan. Setelah tersedia, konfigurasi provider asli dapat disimpan melalui halaman admin sesuai PRD. Belum ada pembuatan tiket, database, evaluasi persona, knowledge search, atau pelacakan.

