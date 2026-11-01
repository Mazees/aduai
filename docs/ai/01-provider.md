# 1. Provider OpenAI-compatible

1. Dimas membaca konfigurasi server dengan bentuk `ProviderConfig = { endpoint, model, apiKey }` dari penyimpanan backend.
2. `endpoint` menerima URL dasar berakhiran `/v1` atau URL lengkap chat completions (`/v1/chat/completions`). URL dasar otomatis ditambahkan `/chat/completions`; path khusus provider tetap dipakai sesuai input. Provider harus mendukung streaming dan tool calling.
3. Bungkus `completeWithConfig(config, messages, tools, signal, onText)` sebagai fungsi `Completion` dan masukkan ke dependency agent.
4. Masukkan fungsi Completion yang sama ke `evaluateSubmittedComplaint`; evaluasi tidak mempunyai provider default.
5. Ambil konfigurasi baru untuk request berikutnya ketika admin mengganti pengaturan. Hindari singleton konfigurasi global yang menjadi usang.

Tipe dan adapter tersedia di `src/features/chat/server/provider.ts`. Tidak ada loader file, konfigurasi environment sementara, jawaban buatan, atau fallback provider. Contoh wiring ada di [panduan Dimas](07-backend-dimas.md).

Adapter mengirim model/messages/tools ke provider dan menggabungkan fragmen tool call. Token jawaban diteruskan ke agent. Timeout satu panggilan 90 detik; batas loop chat 120 detik. Respons HTTP gagal, format stream yang tidak sesuai, output berlebih, dan hasil terpotong menghasilkan error aman tanpa meneruskan body error provider.

API key hanya tersedia di server. Endpoint admin pengaturan mengikuti PRD bagian 8.9; pengamanan URL/outbound, penyimpanan terenkripsi, serta autentikasi admin menjadi integrasi backend. Endpoint harus HTTPS; pengecualian HTTP loopback hanya tersedia pada development untuk provider yang memang dijalankan sendiri.
