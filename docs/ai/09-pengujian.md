# 9. Pengujian AI

## Sebelum backend terhubung

1. Jalankan npm ci, npm run typecheck, npm run lint, dan npm run build. File privat tidak diperlukan.
2. Jalankan npm run dev dan kirim POST /api/chat dengan body valid berikut:

```json
{ "messages": [{ "role": "user", "content": "Lampu jalan depan sekolah mati." }], "draft": null }
```

3. Pastikan HTTP 503 dan error.code AI_INTEGRATION_NOT_CONFIGURED. Ini kondisi integrasi yang sengaja belum diisi, bukan respons model.
4. Pastikan endpoint evaluasi pengujian sudah tidak tersedia dan tidak ada perintah CLI pada package.json.

## Setelah backend Dimas terhubung

1. Coba aduan dengan emosi berbeda dan informasi bertahap; pastikan respons empatik dan saran sementara relevan.
2. Amati beberapa tool dalam satu giliran: toolCallId berpasangan dan seq meningkat.
3. Main Knowledge valid dimuat setiap giliran; 3000 karakter diterima, 3001 ditolak. Informasi wilayah tidak ditebak menjadi alamat kejadian.
4. Patch draft mempertahankan data lama, WhatsApp dinormalisasi, dan konten admin tidak berisi kontak yang dikenali.
5. Draft lengkap tetap meminta persetujuan. Konfirmasi tanpa sesi/key atau data lengkap ditolak.
6. Kirim laporan melalui chat; complaint.created dan done.submission berisi receipt sama tanpa WhatsApp/mode.
7. Retry dengan Idempotency-Key dan payload sama tidak membuat laporan/jadwal ganda; payload berbeda menghasilkan konflik.
8. Kode pelacakan salah ditolak; hasil tracking hanya data publik.
9. Evaluasi otomatis membaca konteks melalui tools, boleh menghasilkan prompt kosong, serta tidak menggandakan persona. Pekerjaan sukses berulang menghasilkan SKIPPED.
10. Uji stream terputus sebelum dan sesudah complaint.created, pembatalan, provider gagal, dan jadwal evaluasi gagal. Laporan tersimpan tetap mempunyai receipt dan status backend yang konsisten.
11. Uji vector search memakai corpus resmi dan embedding 384 dimensi yang sama saat indexing/query; sumber belum dipublikasikan tidak muncul.

Tidak ada folder tes atau helper CLI permanen. Hasil production perlu diverifikasi lagi dengan service backend nyata; lint/typecheck/build saja belum membuktikan integrasi database atau deployment embedding.
