# 4. Konfirmasi pengiriman

1. Browser membuat sessionId UUID per sesi. Setiap giliran memakai Idempotency-Key UUID; retry memakai key dan payload yang sama.
2. Agent menyiapkan draft dari aduan dan WhatsApp, lalu meminta pengadu memeriksa datanya.
3. Balasan seperti `sudah` atau `kirim` diterima hanya jika asisten sebelumnya meminta pemeriksaan. Tombol kirim mengirim `confirmed: true`.
4. Handler memvalidasi ulang data sebelum stream; agent menormalisasi dan menyamarkan kembali draft sebelum submit.
5. Agent memanggil `dependencies.submit(draft, { sessionId, idempotencyKey }, signal)`. Pembuatan tiket tidak bergantung pada keputusan bebas model.
6. Backend memvalidasi, memisahkan WhatsApp dari konten admin, menyimpan laporan NEW secara idempoten, lalu mengembalikan SubmissionReceipt.
7. Agent memanggil `onSubmitted(receipt, conversation)` untuk penjadwalan evaluasi. Promise callback ditunggu agar kegagalannya tertangani, tetapi callback sebaiknya hanya mengantrekan pekerjaan.
8. Agent mengirim complaint.created, teks receipt, dan done.submission. Draft final menjadi null dan readyForConfirmation false.

Receipt berisi complaintId, ticketNumber, accessCode, status NEW, dan createdAt. Tidak ada field mode atau WhatsApp. Jangan letakkan kode akses di URL/log atau tampilkan kepada admin.

Backend menyimpan key/hasil submit secara persisten. Key dan payload sama harus mengembalikan receipt sama; payload berbeda untuk key sama melempar Error('IDEMPOTENCY_CONFLICT'). sessionId bukan autentikasi. Callback evaluasi dapat dipanggil lagi saat retry receipt; backend harus mendeduplikasi jadwal berdasarkan complaintId.

Jika callback gagal, agent mencatat kode log AI_EVALUATION_SCHEDULING_FAILED tanpa payload sensitif dan tetap mengembalikan receipt. Backend harus mencatat status gagal/retry pekerjaan; laporan tetap berhasil. Pembatalan atau putus koneksi tidak membatalkan laporan yang sudah tersimpan, dan callback tetap dijalankan setelah submit berhasil.

Jalur chat ini sudah melakukan submit. Frontend tidak memanggil POST /api/complaints lagi setelah konfirmasi chat atau receipt. Endpoint REST tersebut, jika disediakan Dimas, memakai service bisnis yang sama untuk pemakaian di luar jalur chat.
