# 6. Evaluasi dan persona

`evaluateSubmittedComplaint({ complaintId, conversation }, { repository, complete })` dipanggil worker backend setelah laporan berhasil dibuat. Repository dan provider wajib disuntikkan; tidak ada penyimpanan atau konfigurasi default.

1. `repository.claim` mengunci evaluasi memakai token/lease; pekerjaan yang sudah sukses atau masih dikunci menghasilkan SKIPPED.
2. Agent membaca evaluasi dan persona melalui tools `get_existing_evaluations` dan `get_active_persona_prompts`.
3. Agent memeriksa kandidat dengan `check_similar_learning` dan mengajukan hasil melalui `save_evaluation`.
4. Validasi struktur, panjang, identitas yang dikenali, instruksi berbahaya, dan duplikasi dilakukan server.
5. Kandidat baru melewati pemeriksaan model kedua untuk keamanan, konflik, dan kesamaan makna.
6. `repository.commit` menyimpan evaluasi serta persona secara atomik. Prompt langsung aktif sesuai implementasi repository backend, tanpa persetujuan admin.
7. Chat berikutnya memuat maksimal 10 POSITIVE dan 10 NEGATIVE prompt di bawah aturan dasar.

Hasil SUCCESS berisi evaluation, positivePrompts, dan negativePrompts. Kedua daftar prompt boleh kosong. `evaluation` tetap berupa ringkasan umum singkat. Hasil lain adalah SKIPPED atau FAILED dengan kode error aman. Timeout evaluasi 180 detik, maksimal 6 putaran dan 12 tool call.

Kontrak `LearningRepository` ada di `src/features/learning/server/repository.ts`: context, claim, commit, fail. Backend harus memeriksa token/lease, deduplikasi lintas instance, serta transaksi. `fail` hanya mengubah pekerjaan milik token yang sesuai.

Callback `AiServices.onSubmitted` menerima receipt dan conversation sementara untuk penjadwalan. Callback harus segera mengantrekan pekerjaan, bukan menunggu evaluasi model. Simpan payload hanya sementara sesuai TTL; jangan menyimpan riwayat chat permanen. Retry harus memakai claim/commit yang sama. Kegagalan jadwal/evaluasi tidak membatalkan laporan.

Tidak ada endpoint evaluasi publik atau endpoint pengujian lokal. Monitoring admin dan worker adalah pekerjaan Dimas. Deduplikasi/penyamaran AI tidak menjamin semua konflik atau identitas terdeteksi.
