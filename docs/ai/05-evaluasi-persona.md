# 5. Evaluasi percakapan dan persona

**Status: belum diimplementasikan.**

## Tujuan

Setiap laporan yang berhasil dibuat memicu evaluation agent. Agent mengevaluasi cara AI menanggapi pengadu, bukan memutuskan kualitas penanganan laporan. Hasil yang berguna dan belum ada menjadi positive/negative prompt aktif tanpa persetujuan admin. Tidak wajib ada pelajaran baru.

## Langkah implementasi

1. Setelah backend memastikan tiket berhasil dibuat, buat satu pekerjaan evaluasi untuk laporan tersebut.
2. Sediakan riwayat percakapan secara sementara untuk worker; hapus setelah diproses atau saat TTL habis. Chat tidak disimpan sebagai riwayat permanen.
3. Agent membaca ringkasan evaluasi dan prompt aktif yang relevan melalui tools.
4. Agent menilai respons berdasarkan bukti dalam percakapan, lalu mengecek kandidat yang mirip.
5. Agent menghasilkan JSON dengan evaluasi, `positivePrompts`, dan `negativePrompts`; kedua daftar dapat kosong.
6. Validasi format, panjang, informasi pribadi, dan konflik dengan aturan dasar; simpan hasil dan prompt baru secara otomatis.
7. Saat percakapan baru, muat prompt aktif di bawah instruksi dasar dalam system prompt.

## Tools yang direncanakan

- `get_existing_evaluations`: baca ringkasan evaluasi relevan.
- `get_active_persona_prompts`: baca aturan yang aktif.
- `check_similar_learning`: periksa kandidat agar tidak mengulangi pelajaran.
- `save_evaluation`: catat hasil, termasuk ketika daftar kosong.
- `save_persona_prompts`: simpan aturan baru yang valid dan langsung aktifkan.

Penyimpanan dan otorisasi dikerjakan bersama backend. Jangan mengekspos tool penulisan langsung ke guest. Pastikan retry dan evaluasi yang berjalan bersamaan tidak menggandakan hasil secara tidak sengaja.

## Contoh hasil kosong

```json
{
  "evaluation": "Tidak ditemukan pelajaran komunikasi baru.",
  "positivePrompts": [],
  "negativePrompts": []
}
```

## Uji penerimaan

- Percakapan yang menunjukkan kebutuhan empati menghasilkan aturan umum tanpa identitas.
- Pelajaran yang sudah ada menghasilkan daftar kosong atau tidak menambah duplikat.
- Tidak ada bukti yang cukup menghasilkan daftar kosong, bukan pelajaran yang dibuat-buat.
- Prompt berisi identitas atau bertentangan dengan aturan dasar ditolak.
- Evaluasi gagal tidak membatalkan tiket dan persona lama tetap tersedia.
- Prompt baru terbaca pada giliran percakapan berikutnya setelah penyimpanan aktif terhubung.

Ini memperbarui instruksi persona, bukan melatih ulang model.

