# Setup WhatsApp dan bukti

1. Buat perangkat di Fonnte. Isi `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY` di environment server.
2. Terapkan migrasi `20261101020000_whatsapp_evidence.sql` pada database yang telah memiliki tabel `evidence`. Pastikan bucket `evidence` privat. Migrasi belum diterapkan otomatis.
3. Buat akun admin di Supabase Auth, masuk melalui `/admin/login`, lalu buka `/admin/pengaturan/whatsapp`, simpan token perangkat Fonnte, dan pindai QR menggunakan WhatsApp > Perangkat tertaut.
4. Buka aduan di daftar admin, pilih status, unggah tepat satu bukti JPG, PNG, WebP, atau PDF maksimal 4 MB, lalu simpan. Status `QUEUED` berarti permintaan diterima Fonnte; `FAILED` berarti admin perlu menangani pengiriman yang gagal.
5. Uji pada deployment Vercel dengan nomor uji: pastikan pesan berisi tautan bukti yang dapat dibuka. Nomor pengadu tidak ditampilkan pada API admin. Tautan bukti dapat dibuka oleh siapa pun yang memilikinya.

Fonnte menangani sesi WhatsApp. Token dan service role key hanya berada di server. Sistem tidak menyimpan antrean lokal untuk mengulang pengiriman yang gagal.
