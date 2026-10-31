# 1. Konfigurasi provider AI

Agent dirancang untuk provider yang mendukung chat completions dan tool calling. Halaman admin nantinya menyediakan URL endpoint lengkap, nama model, dan API key. Cahya mengerjakan halaman, Dimas penyimpanan dan API admin, serta Mada menghubungkan agent ke konfigurasi tersebut.

Untuk sementara konfigurasi provider **tidak disimpan di environment**. Agent memakai fallback mock lokal tanpa API key. Mock hanya menguji mekanisme; bukan model AI. Dalam production, fallback mock menghasilkan error konfigurasi agar tidak tampak sebagai layanan AI sungguhan.

## Langkah berikutnya

1. Buat halaman admin dan backend konfigurasi sesuai PRD bagian 8.9.
2. Simpan API key terenkripsi di server dan jangan tampilkan nilainya ke browser.
3. Hubungkan konfigurasi yang tersimpan ke tipe `ProviderConfig` di `src/features/chat/server/provider.ts`.
4. Validasi endpoint, akses admin, jaringan outbound, timeout, dan kompatibilitas tool calling provider.
5. Uji provider asli dengan kredensial yang dimasukkan melalui mekanisme aman setelah integrasi tersedia.

Jangan hardcode API key atau memakai data pengadu sebenarnya untuk pengujian mock.

