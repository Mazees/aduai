# 7. Backend Dimas

## 1. Titik wiring

Isi `getAiServices()` di `src/lib/ai/services.ts`. Route `src/app/api/chat/route.ts` sudah memanggil `createChatHandler(getAiServices)` dan memakai runtime Node.js bawaan. Dengan cacheComponents aktif, jangan menambahkan export const runtime pada route. Factory tidak perlu ditulis ulang untuk menghubungkan database.

Saat ini resolver sengaja melempar `AI_INTEGRATION_NOT_CONFIGURED`; handler mengembalikan 503 JSON sebelum membuka SSE. Ini satu-satunya bagian konfigurasi yang perlu diganti dengan service milik backend. Tidak ada provider default atau adapter data sementara.

## 2. Contoh penyambungan

Kerangka berikut memakai nama `services` untuk service yang **harus diimplementasikan Dimas**, bukan modul database yang sudah tersedia. Pertahankan interface AiServices yang sudah ada di services.ts; ganti isi getAiServices dan tambahkan import provider, pencarian, serta service backend milik Dimas.

```ts
import { completeWithConfig, type Completion } from '@/features/chat/server/provider';
import { createKnowledgeSearch } from '@/features/knowledge/server/search';

export async function getAiServices(): Promise<AiServices> {
  const config = await services.provider.readConfig();
  const complete: Completion = (messages, tools, signal, onText) =>
    completeWithConfig(config, messages, tools, signal, onText);

  return {
    agent: {
      complete,
      submit: (draft, context, signal) =>
        services.complaints.submit(draft, context, signal),
      mainKnowledge: (signal) => services.settings.mainKnowledge(signal),
      persona: (signal) => services.learning.activePrompts(signal),
      search: createKnowledgeSearch(services.knowledge),
      track: (input, signal) => services.complaints.track(input, signal),
    },
    async onSubmitted(receipt, conversation) {
      // Tunggu acknowledgement penyimpanan pekerjaan, bukan seluruh evaluasi model.
      // Service wajib deduplikasi berdasarkan complaintId dan menangani gagal/retry.
      await services.evaluationJobs.enqueue({
        complaintId: receipt.complaintId,
        conversation,
      });
    },
  };
}
```

Handler memanggil resolver setiap request valid. Baca konfigurasi provider terbaru di server, simpan key terenkripsi, dan jangan mengirim config lengkap ke frontend. ProviderConfig hanya `{ endpoint: string; model: string; apiKey: string }`; endpoint lengkap chat completions. Semua enam fungsi agent serta onSubmitted wajib tersedia, walaupun mainKnowledge sah mengembalikan string kosong.

`createChatHandler` juga menerima resolver dengan parameter Request bila backend perlu membaca konteks request. Jangan membaca body lagi di resolver karena sudah dikonsumsi handler. Pemeriksaan rate limit/otorisasi tambahan milik backend dapat membungkus route sebelum memanggil handler. Validasi origin bawaan tidak menggantikan rate limit atau autentikasi admin.

## 3. Kontrak service

| Fungsi | Input | Output/ketentuan |
|---|---|---|
| complete | ModelMessage[], ToolDefinition[], signal?, onText? | Promise<ModelResult>; biasanya completeWithConfig. |
| submit | ComplaintDraft, SubmissionContext, signal? | Promise<SubmissionReceipt>, hanya setelah transaksi laporan berhasil. |
| mainKnowledge | signal? | Promise<string>, maksimal 3000 karakter JS .length. |
| persona | signal? | Promise<PersonaRule[]> aktif, urutkan yang paling relevan terlebih dahulu. |
| search | query, limit, signal? | Promise<KnowledgeResult[]>; disediakan createKnowledgeSearch(repository). |
| track | { ticket, accessCode }, signal? | Promise<ComplaintTrackingResult> setelah verifikasi kode akses. |
| onSubmitted | SubmissionReceipt, ChatMessage[] | void atau Promise<void>; menjadwalkan evaluasi otomatis. |

Tipe service agent ada di `src/features/chat/server/agent.ts`. Tipe laporan di `src/types/complaint.ts`:

```ts
interface SubmissionContext {
  sessionId: string;
  idempotencyKey: string;
}
interface SubmissionReceipt {
  complaintId: string; // UUID
  ticketNumber: string;
  accessCode: string;
  status: 'NEW';
  createdAt: string;   // ISO 8601 UTC
}
interface ComplaintTrackingResult {
  ticketNumber: string;
  status: ComplaintStatus;
  summary: string;
  updates: { status: ComplaintStatus; note: string; createdAt: string }[];
}
```

- Idempotency-Key diteruskan tanpa diganti. Key dan payload sama mengembalikan receipt sama; payload berbeda melempar `new Error('IDEMPOTENCY_CONFLICT')`. Backend menyimpan key/hasil serta membandingkan payload secara persisten sesuai PRD. sessionId bukan identitas terverifikasi.
- Service submit tetap memvalidasi dan menyamarkan ulang data sebelum menulis konten admin. Simpan WhatsApp terpisah dengan akses privat. Regex AI tidak mengenali semua identitas.
- Simpan hash kode akses dan hasil retry secara aman sesuai masa berlaku. Jangan log key provider, WhatsApp, kode akses, atau percakapan.
- track memverifikasi kode akses, mengembalikan data publik saja, dan memakai error generik bila salah. Mapping input tool ticket ke nomor tiket service dikerjakan di adapter backend.
- `mainKnowledge` dimuat setiap giliran. API pengaturan mengikuti PRD GET/PUT `/api/admin/ai/main-knowledge`; validasi yang sama dapat memakai `validateMainKnowledge`.
- `createKnowledgeSearch` memanggil KnowledgeRepository.match dengan vector 384 dimensi; backend hanya mencari dokumen terpublikasi. Lihat [vector search](05-knowledge-vector.md).

## 4. Worker evaluasi

Worker memuat konfigurasi provider dan LearningRepository backend, lalu memanggil:

```ts
import { evaluateSubmittedComplaint } from '@/features/learning/server/evaluate';
import { completeWithConfig, type Completion } from '@/features/chat/server/provider';

const config = await services.provider.readConfig();
const complete: Completion = (messages, tools, signal, onText) =>
  completeWithConfig(config, messages, tools, signal, onText);
const result = await evaluateSubmittedComplaint(
  { complaintId: job.complaintId, conversation: job.conversation },
  { repository: services.learning.repository, complete },
);
```

`LearningRepository` di `src/features/learning/server/repository.ts` wajib menyediakan:

- context(signal?): `{ evaluations: string[]; prompts: PersonaRule[] }`, konteks umum tanpa identitas dan persona aktif.
- claim(complaintId, token, signal?): boolean; tolak pekerjaan sukses atau lease lain yang aktif.
- commit(complaintId, token, result, signal?): transaksi evaluasi dan prompt aktif. Pastikan pemilik token/lease serta deduplikasi lintas instance.
- fail(complaintId, token): ubah hanya pekerjaan milik token yang sesuai.

Hasil SUCCESS boleh memiliki kedua daftar prompt kosong; SKIPPED tidak mengulang hasil sukses; FAILED membawa kode aman. Prompt yang lolos langsung aktif tanpa approval admin. Lease harus cukup untuk batas evaluasi 180 detik dan dilepas saat commit/fail. Jangan mengandalkan flag di memori satu proses.

Submit sebaiknya mencatat metadata pekerjaan evaluasi bersamaan dengan laporan. onSubmitted hanya menyediakan konteks sementara untuk antrean yang sudah dilindungi idempotensi. Callback dapat dipanggil lagi saat receipt di-retry; deduplikasi berdasarkan complaintId. Gunakan TTL untuk payload percakapan dan jangan simpan chat permanen.

Jika enqueue gagal, catat status pekerjaan FAILED dan jadwalkan retry backend. Agent tetap mengembalikan receipt dan mencatat kode log aman; jangan menafsirkan receipt sebagai bukti evaluasi sukses. Tidak ada antrean durable, SQL, worker, atau API admin yang diimplementasikan modul AI ini. Next.js after dapat dipakai untuk pekerjaan sesuai batas runtime, tetapi bukan pengganti penyimpanan pekerjaan/retry yang persisten.

## 5. Kesiapan frontend

Setelah resolver tersedia, Cahya dapat memakai endpoint yang sama tanpa mengubah kontrak SSE. Uji [skenario integrasi](09-pengujian.md), terutama receipt sesudah commit, idempotensi, anonimitas admin, serta evaluasi otomatis. Frontend chat tidak memanggil POST /api/complaints lagi setelah konfirmasi chat; endpoint REST, jika dibuat, memakai service bisnis yang sama.
