# 3. API dan streaming

`src/features/chat/server/http.ts` mengekspor `createChatHandler(getServices)`. Route `POST /api/chat` menggunakan factory ini dengan resolver dari `src/lib/ai/services.ts`; runtime Node.js.

1. Periksa origin dan payload maksimum 100000 byte.
2. Validasi 1-40 pesan, maksimal 5000 karakter per pesan, role user/assistant, dan pesan terakhir user.
3. Normalisasi dan samarkan draft. Validasi sesi UUID, confirmed boolean, serta Idempotency-Key UUID bila diberikan.
4. Untuk submit, wajib ada draft lengkap, sessionId dan Idempotency-Key. Data lengkap saja belum berarti persetujuan.
5. Resolve service backend sebelum mengirim header SSE.
6. Jalankan agent dan serialisasi ChatStreamEvent menjadi frame SSE. Pembatalan stream diteruskan ke signal agent.

Error sebelum stream memakai JSON `{ error: { code, message } }`. Resolver yang belum diisi menghasilkan HTTP 503 `AI_INTEGRATION_NOT_CONFIGURED`; gangguan resolver backend menghasilkan 503 `AI_INTEGRATION_UNAVAILABLE`. Input tidak valid menghasilkan 400, body berlebih 413, dan origin ditolak 403.

Sesudah stream dimulai, error agent berupa event `error`. Konflik idempotensi dari service submit harus dilempar dengan kode `IDEMPOTENCY_CONFLICT`; dalam SSE ini tidak dapat mengubah status HTTP menjadi 409. Endpoint REST pembuatan laporan tetap memakai HTTP 409 sesuai PRD.

Event: run.started, step.started, step.completed, step.failed, reply.delta, draft.updated, complaint.created, done, error. Semua memiliki runId/seq. Langkah menggunakan toolCallId. Argumen mentah tool, prompt sistem, dan secret tidak disiarkan sebagai status.

`done.reply` dan `done.draft` adalah nilai final. `complaint.created` berarti service backend sudah membuat laporan, termasuk bila stream kemudian terputus. Detail tampilan dan contoh parser ada di [panduan Cahya](08-frontend-cahya.md).

Verifikasi integrasi: [pengujian flow AI](09-pengujian.md). Perintah proyek: `npm run typecheck`, `npm run lint`, dan `npm run build`.
