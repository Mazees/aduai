# 8. Frontend Cahya

## 1. Status dan tipe bersama

POST `/api/chat` sudah tersedia dengan handler SSE. Saat backend Dimas belum dihubungkan, permintaan valid menghasilkan HTTP 503 `{ error: { code: 'AI_INTEGRATION_NOT_CONFIGURED', message: '...' } }`. Tampilkan kondisi layanan belum siap; tidak ada endpoint data sementara atau jawaban pengganti.

Import tipe dari `src/types/chat.ts` (ChatRequest, ChatMessage, ChatStreamEvent) dan `src/types/complaint.ts` (ComplaintDraft, SubmissionReceipt). Gunakan import type. Jangan impor provider, agent, atau modul server ke komponen browser.

## 2. Mengirim satu giliran

Browser menyimpan chat/draft dan sessionId UUID. Maksimum satu request aktif per sesi. Buat Idempotency-Key UUID untuk setiap giliran baru; simpan key bersama snapshot payload untuk retry request yang sama.

```http
POST /api/chat
Content-Type: application/json
Accept: text/event-stream
Idempotency-Key: a0000000-0000-4000-8000-000000000001
```

```json
{
  "sessionId": "b0000000-0000-4000-8000-000000000001",
  "messages": [{ "role": "user", "content": "Lampu jalan depan sekolah mati." }],
  "draft": null,
  "confirmed": false
}
```

Kirim riwayat yang dibutuhkan, bukan hanya pesan terakhir. Role user/assistant saja; pesan terakhir user. Batas 40 pesan, masing-masing 5000 karakter, total body 100000 byte. Mulai sesi baru bila konteks penuh.

Draft mengikuti tipe bersama: description, category (string/null), aiSummary, whatsapp. Gunakan draft terbaru yang dikembalikan server. `confirmed: true` hanya untuk tombol kirim setelah pengadu memeriksa draft; sertakan pesan user tentang konfirmasinya. Balasan natural `sudah`/`kirim` juga diproses server bila pesan asisten sebelumnya meminta pemeriksaan.

Header key bersifat opsional pada chat biasa, wajib saat submit. Mengirim UUID valid di setiap giliran membuat konfirmasi natural tetap bekerja. Data lengkap atau readyForConfirmation true saja tidak berarti persetujuan.

## 3. Contoh pembaca SSE

Gunakan fetch, bukan EventSource karena membutuhkan body POST. `readSse` adalah utilitas murni yang boleh diimpor browser; parser ini menangani UTF-8, CRLF dan frame yang terpotong antar-chunk.

```ts
import { readSse } from '@/lib/ai/sse';
import type { ChatRequest, ChatStreamEvent } from '@/types/chat';

async function sendTurn(
  payload: ChatRequest,
  idempotencyKey: string,
  onEvent: (event: ChatStreamEvent) => void,
  signal?: AbortSignal,
) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
      'Idempotency-Key': idempotencyKey,
    },
    body: JSON.stringify(payload),
    signal,
  });
  if (!response.ok) {
    const body = await response.json();
    throw new Error(body.error?.message ?? 'Permintaan gagal.');
  }
  if (!response.body || !response.headers.get('Content-Type')?.includes('text/event-stream')) {
    throw new Error('Format respons tidak sesuai.');
  }
  let terminal = false;
  for await (const frame of readSse(response.body)) {
    const event = { event: frame.event, data: JSON.parse(frame.data) } as ChatStreamEvent;
    onEvent(event);
    if (event.event === 'done' || event.event === 'error') {
      terminal = true;
      break;
    }
  }
  if (!terminal) throw new Error('Respons terputus sebelum selesai.');
}
```

Contoh ini hanya pembaca transport. Komponen Cahya menangani state, error event, penutupan indikator dalam finally, penyimpanan browser, serta tombol retry. Jangan JSON.parse langsung setiap chunk jaringan; satu chunk bukan satu event.

## 4. Pemetaan event ke tampilan

Setiap event memiliki runId dan seq yang meningkat dalam satu stream. Pasangkan langkah memakai toolCallId, karena tool yang sama dapat berjalan beberapa kali.

| Event | Tampilan/state |
|---|---|
| run.started | Buat bubble asisten dan indikator proses. |
| step.started | Tambahkan langkah berjalan dengan label server. |
| step.completed | Tandai toolCallId terkait selesai. |
| step.failed | Tandai langkah gagal; agent masih bisa melanjutkan. |
| reply.delta | Append text sesuai urutan seq ke bubble yang sama. |
| draft.updated | Perbarui draft, missingFields dan readyForConfirmation; jangan submit otomatis. |
| complaint.created | Simpan receipt segera dan tandai laporan berhasil dibuat. |
| done | Ganti bubble dengan reply final, simpan draft final dan submission bila ada; jangan append reply sekali lagi. |
| error | Hentikan indikator, tampilkan message dan retry sesuai retryable. |

Label langkah sudah disediakan server: Menyiapkan ringkasan, Mencari informasi layanan, Memeriksa status laporan, Menyimpan aduan. Jangan menampilkan argumen/hasil tool mentah atau penalaran model.

Receipt complaint.created dan done.submission sama: complaintId, ticketNumber, accessCode, status NEW, createdAt. Tidak ada mode/WhatsApp. Tampilkan tiket dan kode akses hanya kepada pengadu. Setelah submit, draft menjadi null dan readyForConfirmation false.

## 5. Error, retry dan pembatalan

- Sebelum stream: HTTP 400 input/sesi/key/draft salah, 403 origin, 413 body terlalu besar, 503 backend belum dikonfigurasi/tersedia. Respons JSON, bukan SSE.
- Sesudah stream: event error menjadi terminal. `IDEMPOTENCY_CONFLICT` berarti key sudah digunakan untuk data berbeda; jangan otomatis mengirim ulang dengan key baru tanpa keputusan pengadu.
- EOF sebelum done/error: tandai respons parsial sebagai terputus. Simpan receipt bila complaint.created sudah diterima.
- Receipt sudah diterima: jangan mengirim laporan kedua dan jangan memanggil POST /api/complaints. Server chat telah menjalankan submit.
- Koneksi putus tanpa receipt: backend mungkin sudah commit. Retry snapshot request yang sama dengan key yang sama agar hasil idempoten; jangan buat key baru untuk percobaan pengiriman yang sama.
- Tombol Hentikan menggunakan AbortController. Pembatalan tidak membatalkan laporan yang sudah tersimpan atau jadwal evaluasi setelah submit.
- Hilangkan indikator proses dalam finally. Simpan pesan asisten sebagai hasil final hanya saat done; draft parsial jangan dianggap final jika giliran gagal.

Evaluasi berjalan di backend; pengadu tidak perlu menunggu atau memanggil endpoint evaluasi. Monitoring pembelajaran admin mengikuti API Dimas di PRD. API key tidak pernah berada di browser dan nomor WhatsApp tidak boleh tampil di halaman/admin API.

## 6. Main Knowledge di dashboard

Cahya membuat textarea/penghitung maksimal 3000 karakter memakai MAIN_KNOWLEDGE_MAX_CHARACTERS dari `src/lib/ai/main-knowledge.ts`. JS .length harus sama dengan backend. Kontrak GET/PUT `/api/admin/ai/main-knowledge` ada di PRD bagian 8.10; API dan penyimpanannya milik Dimas. Teks ini dimuat server ke system prompt setiap giliran, bukan dikirim pengadu sebagai field request chat.
