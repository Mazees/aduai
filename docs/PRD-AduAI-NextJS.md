# PRD Implementasi AduAI — Next.js

**Versi:** 1.1  
**Target:** MVP hackathon 24 jam  
**Peran:** pengadu guest dan admin login  
**Stack asumsi:** Next.js App Router + TypeScript di Vercel, Supabase PostgreSQL dan pgvector, penyimpanan file privat, model embedding di server, penyedia model AI dengan tool calling, dan penyedia WhatsApp API.

Dokumen ini adalah kontrak implementasi yang disepakati untuk MVP. Nama penyedia AI, database hosting, object storage, dan WhatsApp ditentukan tim berdasarkan layanan yang tersedia.

## 1. Tujuan dan batasan

Pengadu berbicara dengan AI yang memahami situasi, merespons empatik, memberikan masukan sementara yang relevan, dan membantu menyusun laporan. Admin menangani laporan anonim, menyertakan bukti pada setiap perubahan status, dan pengadu menerima WhatsApp otomatis. Setelah laporan dibuat, evaluation agent meninjau percakapan dan memperbarui persona secara otomatis bila menemukan pelajaran baru.

**Data wajib pengadu:** isi aduan dan nomor WhatsApp. Nama tidak diperlukan. Informasi lain seperti lokasi ditanyakan jika relevan dengan aduan, bukan sebagai kolom wajib universal.

**Di luar MVP:** struktur organisasi, penugasan, SLA, analitik lanjutan, feedback, reopen, dan deteksi duplikasi aduan.

## 2. Pembagian tugas

- **Mada — AI:** flow percakapan, tool calling, prompt dasar, draft, penyamaran identitas, evaluation agent, deduplikasi pembelajaran, persona, dan integrasi knowledge jika dikerjakan.
- **Dimas — backend:** skema database, Route Handlers, autentikasi, tiket, bukti, WhatsApp, integrasi AI, serta setup Supabase vector dan deployment jika dikerjakan.
- **Cahya — frontend:** halaman pengadu dan admin, chat di browser, konfirmasi, pelacakan, formulir bukti, monitoring pembelajaran, serta status dan sumber pencarian knowledge jika dikerjakan.

Mada dan Dimas menyepakati fungsi agent dan format input/output; Cahya dan Dimas menyepakati contoh payload API sebelum implementasi.

## 3. Route halaman

| Route | Akses | Fungsi |
|---|---|---|
| `/` | Publik | Beranda. |
| `/aduan/buat` | Guest | Percakapan, draft, konfirmasi, dan hasil tiket; dapat memakai langkah dalam satu halaman. |
| `/lacak` | Guest | Form tiket dan kode akses. |
| `/lacak/[ticket]` | Guest terverifikasi | Status dan riwayat yang diizinkan. |
| `/admin/login` | Publik | Login admin. |
| `/admin/dashboard` | Admin | Jumlah laporan per status. |
| `/admin/aduan` | Admin | Daftar dan filter laporan. |
| `/admin/aduan/[id]` | Admin | Detail anonim dan perubahan status dengan bukti. |
| `/admin/pembelajaran` | Admin | Ringkasan evaluasi dan daftar persona aktif. |

Gunakan App Router, Route Handlers di `app/api`, Server Components untuk tampilan yang sesuai, dan Client Components untuk chat dan formulir. Pemeriksaan autentikasi dan otorisasi wajib dilakukan di server pada setiap endpoint admin.

## 4. Status dan aturan bisnis

| Status | Makna | Transisi yang diizinkan |
|---|---|---|
| `NEW` | Laporan baru menunggu validasi | `ACCEPTED`, `REJECTED` |
| `ACCEPTED` | Diterima | `IN_PROGRESS` |
| `IN_PROGRESS` | Sedang ditangani | `RESOLVED` |
| `RESOLVED` | Selesai | Tidak ada pada MVP |
| `REJECTED` | Ditolak | Tidak ada pada MVP |

Setiap transisi admin wajib menyertakan minimal satu foto atau dokumen sebagai bukti. `REJECTED` juga wajib memiliki alasan. `NEW` dibuat oleh sistem dan tidak membutuhkan bukti admin. Perubahan status, catatan, bukti, dan pencatatan notifikasi dibuat secara konsisten; AI tidak boleh mengubah status.

## 5. Konvensi API

- Base path: `/api`; JSON memakai `Content-Type: application/json`, kecuali upload multipart.
- Field menggunakan `camelCase`; waktu menggunakan ISO 8601 UTC; ID internal UUID.
- Respons sukses: `{ "data": ... }`. Respons error: `{ "error": { "code": "...", "message": "...", "details": {} } }`; `details` opsional dan tidak berisi data sensitif.
- Status HTTP: `400` input tidak valid, `401` belum terautentikasi, `403` tidak berwenang, `404` tidak ditemukan, `409` konflik status atau idempotensi, `413` file terlalu besar, `429` rate limit, `500` kesalahan server, `503` layanan eksternal tidak tersedia.
- Validasi input di server, misalnya menggunakan Zod. Jangan mengandalkan validasi frontend atau hasil AI sebagai otorisasi.
- Nomor WhatsApp dinormalisasi ke format E.164. Contoh pada dokumen bersifat ilustrasi.
- `Idempotency-Key` berupa UUID acak wajib pada pembuatan laporan dan perubahan status. Key yang sama dan payload yang sama mengembalikan hasil sebelumnya; key yang sama dengan payload berbeda menghasilkan `409`. Simpan key dan hasil secara persisten agar retry tidak menggandakan tiket atau notifikasi.
- Jangan mencatat isi chat lengkap, nomor WhatsApp, kode akses, cookie, atau payload sensitif ke log aplikasi.

## 6. Kontrak tipe bersama

```ts
type ComplaintStatus = 'NEW' | 'ACCEPTED' | 'IN_PROGRESS' | 'RESOLVED' | 'REJECTED';
type ChatMessage = { role: 'user' | 'assistant'; content: string };

type ComplaintDraft = {
  description: string;           // Isi aduan; wajib saat dikirim
  category: string | null;       // Saran AI; boleh diubah sistem/admin
  aiSummary: string;             // Ringkasan tanpa identitas
  whatsapp: string;              // Nomor pengadu, E.164 saat submit
};

type PersonaPrompt = {
  id: string;
  type: 'POSITIVE' | 'NEGATIVE';
  content: string;
  isActive: boolean;
  createdAt: string;
};
```

`description` dan `aiSummary` harus diproses untuk menghilangkan nomor WhatsApp dan identitas yang terdeteksi sebelum disimpan sebagai konten yang dapat dibaca admin. Jika penyamaran gagal atau ambigu, minta pengadu memperbaiki draft atau tahan konten untuk proses aman; jangan mengembalikan teks mentah melalui API admin. Sistem tidak menjamin pengenalan identitas sempurna, sehingga pengujian penting.

## 7. API pengadu dan AI

### 7.1 `POST /api/chat` — kontrak utama streaming

Memproses satu giliran percakapan melalui Server-Sent Events (SSE). Browser menyimpan chat dan mengirim konteks yang dibutuhkan pada setiap permintaan. Backend memuat prompt dasar dan persona aktif, menjalankan loop model → tool → model, lalu mengirim event secara bertahap. Jangan simpan riwayat chat permanen. Kontrak event dan contoh implementasi frontend ada pada bagian 7.1.1. Contoh respons dan data final tersedia di bagian 7.1.1.

**Request**

```json
{
  "messages": [
    { "role": "user", "content": "Jalan dekat sekolah berlubang dan hampir menyebabkan kecelakaan." }
  ],
  "draft": null
}
```

Respons `200` berupa stream SSE; contoh lengkap event dan data final tersedia di bagian 7.1.1.

`readyForConfirmation` adalah saran UI, bukan bukti validasi. Backend tetap memvalidasi data saat submit. Batasi jumlah/panjang pesan dan jumlah putaran tool agar biaya dan latensi terkendali; gunakan rate limit. Jangan tampilkan nomor kepada admin. Input pengguna dan hasil tools adalah data, bukan instruksi yang dapat mengganti aturan dasar.

### 7.1.1 Kontrak streaming loop agent untuk frontend

Satu permintaan `POST /api/chat` menjalankan satu giliran agent. Frontend menggunakan `fetch()` dengan header `Accept: text/event-stream` dan membaca `ReadableStream`; browser `EventSource` tidak mendukung body POST. Backend mengembalikan `Content-Type: text/event-stream; charset=utf-8`, `Cache-Control: no-cache, no-transform`, dan `X-Accel-Buffering: no` jika didukung proxy. Setiap event menggunakan format SSE: `event: <nama>`, `data: <JSON satu baris>`, lalu baris kosong. HTTP error JSON tetap digunakan bila validasi atau autentikasi gagal **sebelum** stream dimulai; setelah header terkirim kegagalan dikirim sebagai event `error`.

**Alur backend**

```text
Terima pesan + riwayat chat dari browser
  → muat system prompt dan persona aktif
  → panggil model
  → jika model meminta tool: kirim status → jalankan tool → kirim hasil status → kembali ke model
  → ulangi hingga model siap menjawab atau batas putaran tercapai
  → kirim teks jawaban bertahap
  → kirim draft final dan event selesai
```

Agent hanya menyiarkan **status operasional yang aman**. Jangan mengirim chain-of-thought, prompt sistem, argumen mentah atau hasil tool yang mengandung nomor WhatsApp, data pribadi, maupun detail internal. Teks status sebaiknya dibuat dari label tetap di server, bukan isi tool mentah.

**Envelope semua event**

Setiap `data` memiliki `{ "runId": "uuid", "seq": 1, ... }`. `runId` unik untuk satu giliran dan `seq` meningkat mulai dari 1 dalam stream tersebut. `toolCallId` unik untuk setiap panggilan tool agar frontend dapat memasangkan event mulai dan selesai, termasuk jika tool dipanggil berulang.

| Event | Payload tambahan | Tampilan frontend |
|---|---|---|
| `run.started` | `startedAt` | Buat bubble proses: “AI sedang memproses”. |
| `step.started` | `toolCallId`, `step`, `label` | Tambahkan langkah berstatus berjalan, misalnya “Memahami aduan”. |
| `step.completed` | `toolCallId`, `step`, `label` | Tandai langkah terkait selesai. |
| `step.failed` | `toolCallId`, `step`, `label`, `retryable` | Tandai langkah gagal dengan pesan aman; agent bisa melanjutkan bila kegagalan dapat ditangani. |
| `reply.delta` | `text` | Tambahkan teks ke bubble jawaban asisten secara berurutan. |
| `draft.updated` | `draft`, `readyForConfirmation`, `missingFields` | Perbarui ringkasan draft di browser; jangan kirim laporan otomatis. |
| `done` | `reply`, `draft`, `readyForConfirmation`, `missingFields` | Tandai giliran selesai; `reply` menjadi sumber final jika delta tidak lengkap. |
| `error` | `code`, `message`, `retryable` | Tampilkan error dan opsi coba lagi bila `retryable`; event terminal. |

Nilai `step` yang disarankan: `UNDERSTAND_CONTEXT`, `CHECK_COMPLAINT`, `PREPARE_DRAFT`, `CHECK_STATUS`, `SEARCH_KNOWLEDGE`. Mapping label dibuat di server; setiap tool invocation dapat menghasilkan pasangan `step.started` dan `step.completed` atau `step.failed`. Jika model tidak memanggil tool, event langkah dapat tidak ada. Status bukan uraian penalaran model dan tidak menjamin hasil tertentu.

**Contoh respons stream**

```text
event: run.started
data: {"runId":"run-uuid","seq":1,"startedAt":"2026-10-31T08:30:00Z"}

event: step.started
data: {"runId":"run-uuid","seq":2,"toolCallId":"call-1","step":"UNDERSTAND_CONTEXT","label":"Memahami aduan"}

event: step.completed
data: {"runId":"run-uuid","seq":3,"toolCallId":"call-1","step":"UNDERSTAND_CONTEXT","label":"Memahami aduan"}

event: step.started
data: {"runId":"run-uuid","seq":4,"toolCallId":"call-2","step":"CHECK_COMPLAINT","label":"Memeriksa informasi yang diperlukan"}

event: step.completed
data: {"runId":"run-uuid","seq":5,"toolCallId":"call-2","step":"CHECK_COMPLAINT","label":"Memeriksa informasi yang diperlukan"}

event: reply.delta
data: {"runId":"run-uuid","seq":6,"text":"Saya memahami kekhawatiran Anda. "}

event: reply.delta
data: {"runId":"run-uuid","seq":7,"text":"Di mana lokasi jalan tersebut?"}

event: draft.updated
data: {"runId":"run-uuid","seq":8,"draft":{"description":"Jalan berlubang dekat sekolah.","category":"Infrastruktur","aiSummary":"Jalan berlubang dekat sekolah.","whatsapp":""},"readyForConfirmation":false,"missingFields":["whatsapp"]}

event: done
data: {"runId":"run-uuid","seq":9,"reply":"Saya memahami kekhawatiran Anda. Di mana lokasi jalan tersebut?","draft":{"description":"Jalan berlubang dekat sekolah.","category":"Infrastruktur","aiSummary":"Jalan berlubang dekat sekolah.","whatsapp":""},"readyForConfirmation":false,"missingFields":["whatsapp"]}

```

**Aturan tampilan dan lifecycle**

1. Saat pengguna mengirim pesan, tampilkan pesan pengguna dan panel proses yang dapat dibuka/tutup. Tampilkan label yang mudah dipahami seperti “Memahami aduan” dan “Menyiapkan ringkasan”.
2. Render langkah berdasarkan `toolCallId`, bukan hanya nama tool. Satu tool dapat dipanggil berkali-kali dalam satu loop.
3. Susun `reply.delta` sesuai urutan `seq`; saat `done`, gunakan `reply` final sebagai sumber kebenaran, simpan hasil dalam state chat browser, lalu aktifkan kembali input. Gunakan `draft` pada `done` sebagai draft final.
4. Tampilkan tombol konfirmasi hanya jika `readyForConfirmation` true, tetapi submit tetap memerlukan aksi pengadu dan validasi server. Jangan menampilkan WhatsApp dalam timeline proses; nomor hanya terlihat kepada pengadu dalam draft miliknya.
5. Jika stream berakhir tanpa `done` atau `error`, tandai respons terputus dan tawarkan **Coba lagi**. Respons parsial diberi label belum selesai dan tidak dianggap sebagai jawaban final; percobaan baru memakai `runId` baru. MVP tidak mendukung replay/reconnect otomatis atau resume event.
6. Tombol **Hentikan** memakai `AbortController`; frontend menandai giliran dibatalkan dan backend menghentikan pekerjaan bila runtime/penyedia mendukung. Pembatalan bukan jaminan permintaan upstream langsung berhenti.
7. Maksimum satu giliran aktif per sesi UI. Batasi putaran tool dan durasi di server. Jika batas tercapai, kirim `error` yang aman; jangan membuat tiket atau mengubah status.
8. Evaluasi setelah pembuatan laporan merupakan proses terpisah dari loop chat. Halaman hasil cukup menampilkan tiket; kemajuan evaluasi tidak perlu ditampilkan kepada pengadu.

**Contoh event error terminal**

```text
event: error
data: {"runId":"run-uuid","seq":10,"code":"AGENT_TIMEOUT","message":"AI belum dapat menyelesaikan respons. Silakan coba lagi.","retryable":true}

```

### 7.2 `POST /api/complaints`

Membuat laporan hanya setelah pengadu mengonfirmasi draft. Frontend mengirim header `Idempotency-Key`.

**Request**

```json
{
  "confirmed": true,
  "draft": {
    "description": "Jalan berlubang di depan sekolah pada Jalan Mawar.",
    "category": "Infrastruktur",
    "aiSummary": "Jalan berlubang di depan sekolah dan berpotensi membahayakan pengguna jalan.",
    "whatsapp": "+6281234567890"
  },
  "conversation": [
    { "role": "user", "content": "Jalan depan sekolah berlubang dan saya khawatir anak-anak jatuh." },
    { "role": "assistant", "content": "Saya memahami kekhawatiran Anda. Di mana lokasi tepatnya?" }
  ]
}
```

**Response `201`**

```json
{
  "data": {
    "ticketNumber": "ADU-2026-001284",
    "accessCode": "7K9M-Q3PX",
    "status": "NEW",
    "createdAt": "2026-10-31T08:30:00Z",
    "evaluationStatus": "PENDING"
  }
}
```

- `confirmed` harus `true`; deskripsi dan nomor wajib. Tiket unik dan kode akses dihasilkan server; simpan hanya hash kode akses.
- Tampilkan kode akses kepada pengadu saat berhasil dibuat. Untuk retry idempoten, hasil yang memuat kode harus tersedia sementara secara aman; tetapkan masa berlaku penyimpanan hasil, misalnya 24 jam. Setelah itu jangan mengembalikan kode asli.
- Aduan dan metadata pekerjaan evaluasi dicatat sebelum respons. Percakapan dikirim hanya untuk evaluasi sementara, tidak disimpan permanen. Jika evaluasi tidak dapat dijalankan karena data sementara hilang, tandai `FAILED`; laporan tetap berhasil. Lihat bagian 10 untuk batas deployment.
- Jangan mengandalkan draft dari klien sebagai sumber tepercaya: validasi, normalisasi, dan lakukan penyamaran di server.

### 7.3 `POST /api/tracking/verify`

Memverifikasi nomor tiket dan kode akses. Jangan letakkan kode akses di URL, query string, atau log.

```json
{ "ticketNumber": "ADU-2026-001284", "accessCode": "7K9M-Q3PX" }
```

**Response `200`**

```json
{
  "data": {
    "ticketNumber": "ADU-2026-001284",
    "status": "IN_PROGRESS",
    "summary": "Laporan jalan berlubang di depan sekolah.",
    "updates": [
      { "status": "ACCEPTED", "note": "Laporan diterima.", "createdAt": "2026-10-31T09:00:00Z" },
      { "status": "IN_PROGRESS", "note": "Pemeriksaan sedang dilakukan.", "createdAt": "2026-10-31T10:00:00Z" }
    ]
  }
}
```

Gunakan respons gagal generik untuk tiket atau kode yang salah, rate limit, dan pembandingan hash yang aman. Tidak mengembalikan nomor WhatsApp. Halaman pelacakan meminta kode saat dibuka jika belum diverifikasi; data terverifikasi dapat disimpan sementara di state browser.

## 8. Autentikasi dan API admin

Gunakan session cookie `HttpOnly`, `Secure` pada HTTPS, `SameSite=Lax`, masa berlaku terbatas, dan password hash yang kuat. Terapkan perlindungan CSRF/origin pada permintaan yang mengubah data. Seluruh endpoint admin memeriksa session di server.

### 8.1 `POST /api/admin/auth/login`

```json
{ "email": "admin@example.com", "password": "password-admin" }
```

**Response `200`**: `{ "data": { "admin": { "id": "uuid", "name": "Admin" } } }` dan server menetapkan cookie sesi. Pesan gagal login harus generik; terapkan rate limit.

### 8.2 `POST /api/admin/auth/logout`

Mengakhiri sesi dan menghapus cookie. **Response `200`:** `{ "data": { "success": true } }`.

### 8.3 `GET /api/admin/dashboard`

**Response `200`**

```json
{ "data": { "total": 12, "counts": { "NEW": 3, "ACCEPTED": 2, "IN_PROGRESS": 4, "RESOLVED": 2, "REJECTED": 1 } } }
```

### 8.4 `GET /api/admin/complaints?status=NEW&page=1&limit=20`

`status` opsional; `page` dan `limit` memiliki batas server. Respons hanya berisi field yang diizinkan secara eksplisit.

```json
{
  "data": {
    "items": [
      { "id": "uuid", "ticketNumber": "ADU-2026-001284", "category": "Infrastruktur", "aiSummary": "Jalan berlubang di depan sekolah.", "status": "NEW", "createdAt": "2026-10-31T08:30:00Z" }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1 }
  }
}
```

### 8.5 `GET /api/admin/complaints/[id]`

```json
{
  "data": {
    "id": "uuid",
    "ticketNumber": "ADU-2026-001284",
    "description": "Jalan berlubang di depan sekolah pada Jalan Mawar.",
    "category": "Infrastruktur",
    "aiSummary": "Jalan berlubang di depan sekolah.",
    "status": "NEW",
    "createdAt": "2026-10-31T08:30:00Z",
    "updates": []
  }
}
```

Baik endpoint daftar, detail, dashboard, evaluasi maupun error **tidak boleh mengembalikan nomor WhatsApp, hash kode akses, atau chat mentah**. Gunakan pemilihan kolom/DTO eksplisit, bukan mengembalikan seluruh baris database.

### 8.6 `POST /api/admin/complaints/[id]/updates`

Gunakan `multipart/form-data` agar status dan bukti dikirim dalam satu permintaan. Header `Idempotency-Key` wajib. Untuk Vercel, batasi total body di bawah 4,5 MB termasuk overhead; file lebih besar memerlukan kontrak unggah langsung privat terpisah yang belum ditentukan dalam MVP.

| Field | Tipe | Aturan |
|---|---|---|
| `status` | string | Status tujuan yang diizinkan. |
| `note` | string | Opsional; bisa dilihat pengadu. |
| `rejectionReason` | string | Wajib dan tidak kosong untuk `REJECTED`. |
| `files` | file berulang | Minimal satu; foto atau PDF. |

**Response `201`**

```json
{
  "data": {
    "id": "update-uuid",
    "complaintId": "complaint-uuid",
    "status": "ACCEPTED",
    "note": "Laporan diterima untuk ditindaklanjuti.",
    "evidence": [{ "id": "evidence-uuid", "fileName": "bukti.pdf", "mimeType": "application/pdf" }],
    "notificationStatus": "PENDING",
    "createdAt": "2026-10-31T09:00:00Z"
  }
}
```

Server memeriksa transisi berdasarkan status saat ini dalam transaksi dan menolak perubahan serentak yang konflik dengan `409`. Validasi ukuran, jumlah dan jenis file di server, simpan dalam storage privat menggunakan nama acak, dan jangan percaya MIME dari klien saja. Jika penyimpanan bukti gagal, status tidak berubah. Buat entri notifikasi dalam transaksi yang sama dengan perubahan status. Cleanup file yang gagal dikaitkan ke transaksi.

### 8.7 `GET /api/admin/evidence/[id]`

Hanya admin terautentikasi dapat mengakses bukti; server melakukan streaming file privat atau memberi URL bertanda tangan berumur pendek setelah pemeriksaan akses. Jangan simpan URL publik permanen.

### 8.8 `GET /api/admin/learning?page=1&limit=20`

```json
{
  "data": {
    "evaluations": [
      { "id": "evaluation-uuid", "ticketNumber": "ADU-2026-001284", "summary": "Respons empatik sudah tercakup dalam persona.", "hasNewLearning": false, "status": "SUCCESS", "createdAt": "2026-10-31T08:31:00Z" }
    ],
    "activePrompts": [
      { "id": "prompt-uuid", "type": "POSITIVE", "content": "Akui kekhawatiran pengadu dengan tenang.", "isActive": true, "createdAt": "2026-10-31T08:31:00Z" }
    ],
    "pagination": { "page": 1, "limit": 20, "total": 1 }
  }
}
```

## 9. Kontrak internal AI dan tools

Tools berikut adalah fungsi server yang dipanggil model melalui tool calling, bukan endpoint publik. Agent percakapan tidak memiliki akses untuk menulis status atau memanggil layanan admin.

| Tool | Input | Output |
|---|---|---|
| `analyze_conversation` | Pesan yang relevan dan draft saat ini | Konteks, informasi tersedia dan kebutuhan pengadu. |
| `analyze_complaint` | Percakapan dan draft | Deskripsi, kategori, ringkasan, serta field wajib yang kurang. Dapat digabung dengan tool sebelumnya. |
| `create_complaint_draft` | Data hasil analisis | `ComplaintDraft` untuk diperiksa pengadu; tidak menyimpan tiket. |
| `get_complaint_status` | Tiket dan kode akses | Status resmi setelah verifikasi, atau error generik. |
| `search_knowledge` | Pertanyaan pencarian dan batas hasil | Potongan sumber resmi yang relevan beserta metadata sumber; dipanggil ketika agent membutuhkan informasi rujukan. |

Batasi jumlah pemanggilan tool per giliran, validasi semua argumen dan output, serta tangani timeout. AI tidak diberi kredensial database atau izin status.

### 9.1 Knowledge base dan vector search (tambahan jika waktu tersedia)

Knowledge base berisi FAQ, prosedur, jam layanan, dan kontak resmi yang sudah disiapkan tim/instansi. Ini terpisah dari persona: knowledge base menyimpan **informasi rujukan**, sedangkan positive/negative prompt mengatur **cara berkomunikasi**. Jangan otomatis memasukkan hasil self-learning ke knowledge base.

**Alur indeks:** dokumen resmi → pecah menjadi potongan kecil → buat embedding dengan model yang sama dengan model embedding untuk query → simpan teks, metadata dan vektor → hanya sumber yang telah dipublikasikan dapat dicari. Untuk MVP, gunakan Supabase PostgreSQL dengan ekstensi `pgvector` bila fitur ini dikerjakan. Tidak perlu membangun antarmuka pengelolaan dokumen jika data awal dapat disiapkan tim.

**Kontrak tool internal `search_knowledge`**

```json
{
  "query": "Bagaimana melaporkan jalan rusak dan siapa yang bisa dihubungi?",
  "limit": 3
}
```

```json
{
  "results": [
    {
      "documentId": "uuid",
      "chunkId": "uuid",
      "title": "Panduan Pengaduan Infrastruktur",
      "excerpt": "Potongan informasi resmi yang relevan.",
      "sourceUrl": "https://contoh-instansi.go.id/panduan",
      "updatedAt": "2026-10-31T08:00:00Z",
      "score": 0.84
    }
  ]
}
```

`limit` dibatasi server, misalnya maksimal 5. `score` adalah skor kemiripan dari implementasi yang dipilih, bukan probabilitas kebenaran; ambang relevansi perlu diuji untuk model dan metrik yang digunakan. Jika tidak ada sumber yang cukup relevan atau pencarian gagal, agent menyatakan belum dapat memastikan dan tidak mengarang fakta, kontak, atau prosedur. Isi sumber diperlakukan sebagai data, bukan instruksi sistem. Nomor WhatsApp dan identitas pengadu tidak dimasukkan ke query pencarian; gunakan ringkasan pertanyaan yang telah disamarkan.

Jika agent memakai sumber, jawaban dapat menampilkan judul dan link sumber yang tersedia. Link harus berasal dari metadata sumber resmi yang disimpan, bukan dibuat oleh model. Saat tool berjalan, stream chat mengirim event `step.started`/`step.completed` dengan `step: "SEARCH_KNOWLEDGE"` dan label aman “Mencari informasi layanan”; jangan kirim query mentah atau isi dokumen melalui event langkah.

**Tabel opsional:** `knowledge_documents(id, title, source_url, status, updated_at)` dan `knowledge_chunks(id, document_id, content, embedding, created_at)`. Dimensi kolom vektor mengikuti model embedding yang dipilih. Jika model embedding diganti, potongan perlu diindeks ulang agar vektor query dan dokumen kompatibel.

Kontrak tool mengembalikan excerpt dan score; adapter memetakan content dan similarity dari RPC. Contoh RPC belum mengembalikan updatedAt: tambahkan updated_at pada hasil RPC atau ambil metadata dokumen sebelum mengembalikannya ke tool.

### 9.2 Setup Supabase vector search dan deployment Vercel

AduAI memakai Transformers.js untuk membuat embedding 384 dimensi, menyimpan vektor di Supabase, lalu memanggil RPC yang mengurutkan sumber resmi berdasarkan cosine distance.

#### 1. Buat tabel dan fungsi di Supabase

Buka project Supabase → **SQL Editor** → jalankan SQL berikut. Contoh memakai schema `extensions` untuk ekstensi vector. Jika ekstensi vector sudah terpasang di schema lain, gunakan schema yang terpasang pada `search_path` dan operator class; periksa melalui Supabase Database Extensions terlebih dahulu.

```sql
create schema if not exists extensions;
create extension if not exists vector with schema extensions;

-- Membantu SQL mengenali tipe dan operator class pgvector.
set search_path = public, extensions;

create table if not exists public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source_url text,
  status text not null default 'draft'
    check (status in ('draft', 'published')),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  content text not null,
  embedding extensions.vector(384) not null,
  created_at timestamptz not null default now()
);

create index if not exists knowledge_chunks_document_id_idx
  on public.knowledge_chunks (document_id);

create index if not exists knowledge_chunks_embedding_idx
  on public.knowledge_chunks using hnsw (embedding extensions.vector_cosine_ops);

create or replace function public.match_knowledge(
  query_embedding extensions.vector(384),
  match_threshold double precision default 0.5,
  match_count integer default 3
)
returns table (
  chunk_id uuid,
  document_id uuid,
  title text,
  content text,
  source_url text,
  similarity double precision
)
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select kc.id, kd.id, kd.title, kc.content, kd.source_url,
         1 - (kc.embedding <=> query_embedding) as similarity
  from public.knowledge_chunks as kc
  join public.knowledge_documents as kd on kd.id = kc.document_id
  where kd.status = 'published'
    and 1 - (kc.embedding <=> query_embedding) >= match_threshold
  order by kc.embedding <=> query_embedding
  limit least(greatest(match_count, 1), 5);
$$;

-- Akses knowledge dilakukan melalui server, bukan langsung dari browser.
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;
revoke all on public.knowledge_documents, public.knowledge_chunks from anon, authenticated;
revoke execute on function public.match_knowledge(extensions.vector, double precision, integer)
  from public, anon, authenticated;
grant execute on function public.match_knowledge(extensions.vector, double precision, integer)
  to service_role;
```

`0.5` hanya nilai awal untuk diuji, bukan jaminan relevansi. HNSW dapat ditambahkan meski untuk data demo kecil pencarian biasa mungkin sudah memadai. `service_role` hanya digunakan di server dan dapat melewati RLS; jangan pernah menaruh key-nya di browser atau variabel `NEXT_PUBLIC_`.

#### 2. Install dependency dan konfigurasi Next.js

```bash
npm install @supabase/supabase-js @xenova/transformers@2.17.2
```

Konfigurasikan package native agar dijalankan di server:

```js
// next.config.mjs
const nextConfig = {
  serverExternalPackages: ['@xenova/transformers', 'onnxruntime-node'],
};
export default nextConfig;
```

Isi `.env.local` di server dengan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`. Jangan commit file tersebut. Jalankan route/worker yang memakai model dengan Node.js runtime, misalnya `export const runtime = 'nodejs'`; model native ini tidak ditujukan untuk Edge Runtime.

#### 3. Cara model embedding di-load

Gunakan `Xenova/paraphrase-multilingual-MiniLM-L12-v2` melalui pipeline `feature-extraction`, mode quantized, lalu `pooling: 'mean'` dan `normalize: true`. Model di-load di server saat pertama kali dibutuhkan dan dipakai ulang selama proses server yang sama masih hidup. Saat cold start, file model dapat diunduh dan perlu waktu serta ruang cache; tiap instance serverless dapat memuat modelnya sendiri.

Contoh loader mengikuti pola runtime `require` terisolasi dan pipeline singleton. Gunakan `@xenova/transformers` v2, seperti perintah instalasi di atas:

```js
// lib/vector/embedding.js — server saja
import 'server-only';
import os from 'node:os';
import path from 'node:path';

const MODEL = 'Xenova/paraphrase-multilingual-MiniLM-L12-v2';
let pipelineInstance = null;

async function getPipelineInstance() {
  if (pipelineInstance) return pipelineInstance;

  const getTransformers = new Function(
    "return typeof require !== 'undefined' ? require('@xenova/transformers') : null;",
  );
  const transformers = getTransformers();
  if (!transformers?.pipeline) {
    throw new Error('Runtime Transformers.js tidak tersedia');
  }

  transformers.env.allowLocalModels = false;
  transformers.env.useBrowserCache = false;
  transformers.env.cacheDir = path.join(os.tmpdir(), '.cache');
  pipelineInstance = await transformers.pipeline('feature-extraction', MODEL, {
    quantized: true,
  });
  return pipelineInstance;
}

export async function generateEmbedding(text) {
  if (typeof text !== 'string' || !text.trim()) {
    throw new Error('Teks embedding kosong');
  }
  const extractor = await getPipelineInstance();
  const output = await extractor(text.trim(), { pooling: 'mean', normalize: true });
  const vector = Array.from(output.data);
  if (vector.length !== 384 || !vector.every(Number.isFinite)) {
    throw new Error('Embedding tidak valid');
  }
  return vector;
}
```

Loader ini menyimpan instance setelah loading selesai; permintaan pertama yang bersamaan masih dapat memulai lebih dari satu loading. Pola `new Function(...require...)` bergantung pada apakah `require` tersedia dalam runtime/bundling aktual: **uji di deployment Vercel**, karena tidak dijamin bekerja pada semua konfigurasi Next.js. Jika tidak tersedia, gunakan pola import server-side yang kompatibel dengan versi Next.js yang dipakai dan uji ulang. Cache `/tmp` bersifat sementara dan bisa hilang pada cold start. Jangan mengganti kegagalan model dengan vektor palsu karena hasilnya bukan kemiripan semantik; jika gagal, tampilkan pencarian tidak tersedia atau gunakan pencarian teks yang jelas ditandai.

#### Deploy ke Vercel Hobby

1. Pastikan proyek Next.js dapat di-build, commit dan push ke repositori Git; jangan commit `.env.local` atau service role key.
2. Buat proyek di dashboard Vercel paket **Hobby**, lalu import repositori. Vercel mendeteksi Next.js dan menggunakan perintah build proyek.
3. Tambahkan `SUPABASE_URL` dan `SUPABASE_SERVICE_ROLE_KEY`, serta secret untuk AI dan WhatsApp yang dipakai, pada **Project Settings → Environment Variables**. Gunakan nama env yang konsisten di kode. Jangan beri prefix `NEXT_PUBLIC_` pada service role key. Pilih environment Preview/Production sesuai kebutuhan dan redeploy setelah perubahan.
4. Jalankan SQL knowledge base pada Supabase, lalu indeks dokumen resmi dengan model embedding yang sama.
5. Pastikan route yang memanggil model memakai `export const runtime = 'nodejs'`. Bila perlu, atur `export const maxDuration = 60` pada route dan cek batas yang berlaku untuk konfigurasi Fluid Compute proyek.
6. Deploy **Preview**, lalu uji query pertama (cold start), query berikutnya, isi hasil, sumber yang tidak tersedia, logs, dan penggunaan memori. Pastikan output dimensi 384 dan server bisa mengunduh model saat cold start. Setelah lolos, deploy ke production.

**Batasan biaya dan teknis:** Vercel Hobby gratis dalam kuota dan diperuntukkan penggunaan personal/nonkomersial. Supabase Free juga memiliki kuota; ketersediaan gratis Vercel/Supabase tidak berarti layanan LLM atau WhatsApp ikut gratis. File model quantized sekitar **118 MB**, terpisah dari dependency; loading pertama bisa lambat, cache dapat hilang, dan setiap instance dapat memuat model sendiri. Memori, ukuran function, waktu eksekusi, dan kuota penggunaan perlu diverifikasi pada proyek nyata; pola ini **belum diuji deploy untuk AduAI**. Untuk unggah bukti, perhatikan batas payload Vercel Functions 4,5 MB atau gunakan unggah langsung ke storage privat dengan otorisasi. Tugas evaluasi dan notifikasi juga tidak boleh mengandalkan proses in-memory tetap berjalan setelah respons selesai.

Sumber: [Vercel Hobby](https://vercel.com/docs/plans/hobby), [Vercel Functions limits](https://vercel.com/docs/functions/limitations), [panduan deployment Vercel](https://vercel.com/docs/projects/deploy-from-cli), [model quantized](https://huggingface.co/Xenova/paraphrase-multilingual-MiniLM-L12-v2/blob/main/onnx/model_quantized.onnx), dan [kuota Supabase](https://supabase.com/docs/guides/platform/billing-on-supabase).
#### 4. Input dokumen dan pencarian

1. Siapkan dokumen/FAQ resmi, lalu pecah menjadi potongan pendek yang masuk konteks model; jangan anggap batas 1.500 kata otomatis aman dari pemotongan model.
2. Buat embedding setiap potongan menggunakan fungsi yang sama, simpan metadata dokumen dan vektor ke Supabase dari server, lalu tandai dokumen `published`.
3. Ketika agent memanggil `search_knowledge`, hilangkan nomor WhatsApp/identitas dari query dan buat embedding dengan model yang sama.
4. Panggil RPC dari server:

```ts
const embedding = await generateEmbedding(query);
const { data, error } = await supabaseAdmin.rpc('match_knowledge', {
  query_embedding: embedding,
  match_threshold: 0.5,
  match_count: 3,
});
if (error) throw error;
```

5. Berikan hasil relevan ke agent sebagai data rujukan, bukan instruksi sistem. Jika hasil kosong, AI menyampaikan bahwa informasi belum tersedia dan tidak mengarang jawaban. Tampilkan judul/tautan sumber resmi bila ada.

**Uji minimum:** pastikan vektor berdimensi 384; dokumen yang sudah diindeks muncul untuk pertanyaan yang relevan; dokumen draft tidak muncul; browser tidak memiliki service role key; dan kegagalan load model tidak menghasilkan vektor palsu.

## 10. Evaluation agent dan persona

**Trigger:** setiap laporan yang berhasil dibuat menghasilkan satu pekerjaan evaluasi; evaluasi boleh menghasilkan daftar kosong. Pembuatan tiket tidak menunggu hasil evaluasi.

**Kompromi teknis 24 jam:** pemrosesan setelah respons Next.js tidak selalu bertahan pada lingkungan serverless. Gunakan worker/job runner yang sesuai hosting, dengan percakapan pada penyimpanan sementara yang memiliki TTL dan dihapus setelah evaluasi. Pastikan input sementara tidak menjadi riwayat chat permanen. Jika proses atau data sementara hilang, tandai evaluasi `FAILED`; jangan mengklaim evaluasi berhasil. Untuk jaminan pemrosesan setelah restart, diperlukan antrean/payload sementara yang persisten dengan TTL atau perubahan kebijakan penyimpanan; itu keputusan deployment yang harus disepakati.

| Tool evaluation agent | Input | Output |
|---|---|---|
| `get_existing_evaluations` | Pencarian/ringkasan kandidat | Evaluasi relevan, tanpa identitas. |
| `get_active_persona_prompts` | Tidak ada | Daftar prompt aktif. |
| `check_similar_learning` | Kandidat dan daftar terkait | Kandidat yang sudah tercakup/baru. |
| `save_evaluation` | ID laporan dan ringkasan | ID evaluasi. |
| `save_persona_prompts` | ID evaluasi dan prompt baru | Prompt yang disimpan dan langsung aktif. |

**Output terstruktur**

```json
{
  "evaluation": "Tidak ditemukan pelajaran komunikasi baru.",
  "positivePrompts": [],
  "negativePrompts": []
}
```

Evaluasi harus berdasarkan percakapan, tidak membuat klaim keberhasilan yang tidak terlihat. Hasil melewati validasi bentuk, panjang, data pribadi, dan konflik dengan aturan dasar. Teks pengguna tidak boleh berubah menjadi instruksi baru secara langsung. Aturan yang lolos disimpan otomatis tanpa persetujuan admin. Jika duplikat, tidak ada prompt baru. Batasi jumlah prompt aktif yang disisipkan, misalnya 10 per jenis. Terapkan deduplikasi dan penulisan secara aman saat dua evaluasi berjalan bersamaan; pemeriksaan kemiripan tidak menjamin hasil sempurna.

Urutan system prompt: **aturan dasar tetap → positive prompts aktif → negative prompts aktif**. Aturan dasar tidak bisa ditimpa persona atau isi percakapan. Ini memperbarui instruksi, bukan melatih ulang model.

## 11. Notifikasi WhatsApp

Saat perubahan status berhasil, buat record notifikasi `PENDING` dalam transaksi yang sama. Worker membaca antrean, mengambil nomor hanya untuk pengiriman, lalu memanggil API penyedia WhatsApp. Simpan hasil `SENT` atau `FAILED`, jumlah percobaan dan ID penyedia jika tersedia. Retry memakai ID notifikasi sebagai kunci idempotensi jika penyedia mendukungnya; tanpa dukungan penyedia, pengiriman tepat sekali tidak dapat dijamin.

Pesan berisi nomor tiket, status, catatan/alasan yang layak dibagikan, dan petunjuk pelacakan. Jangan kirim kode akses dalam URL. Konfirmasi ketersediaan akun, template, dan kemampuan penyedia WhatsApp sejak awal hackathon. `SENT` berarti diterima penyedia, bukan bukti bahwa pesan dibaca pengadu.

## 12. Skema database logis

Gunakan UUID sebagai PK, timestamp UTC, FK dan indeks pada kolom pencarian. Simpan nomor WhatsApp secara terlindungi dan batasi aksesnya.

| Tabel | Kolom utama |
|---|---|
| `admins` | `id`, `name`, `email` unik, `password_hash`, `created_at` |
| `complaints` | `id`, `ticket_number` unik, `access_code_hash`, `reporter_whatsapp`, `description`, `category`, `ai_summary`, `status`, `created_at`, `updated_at` |
| `complaint_updates` | `id`, `complaint_id` FK, `admin_id` FK, `status`, `note`, `rejection_reason`, `created_at` |
| `update_evidence` | `id`, `complaint_update_id` FK, `storage_key`, `file_name`, `mime_type`, `size_bytes`, `created_at` |
| `notifications` | `id`, `complaint_update_id` FK unik, `status`, `attempt_count`, `provider_message_id`, `created_at`, `sent_at` |
| `ai_evaluations` | `id`, `complaint_id` FK unik, `summary`, `has_new_learning`, `status`, `created_at` |
| `persona_prompts` | `id`, `evaluation_id` FK, `type`, `content`, `is_active`, `created_at` |
| `idempotency_keys` | `key`, `operation`, `request_hash`, hasil terenkripsi/terbatas, `expires_at` |

Relasi: satu laporan memiliki banyak update dan satu evaluasi; satu update memiliki banyak bukti dan satu notifikasi; satu evaluasi dapat menghasilkan banyak prompt. Bukti minimal satu dan alasan penolakan ditegakkan dalam transaksi aplikasi. Simpan objek file terpisah dari database; database menyimpan kunci privatnya.

## 13. Kriteria penerimaan demo

1. Guest dapat bercakap, menerima tanggapan empatik dan saran sementara yang relevan, lalu mengonfirmasi draft berisi aduan dan WhatsApp.
2. Laporan tersimpan sekali, menghasilkan tiket serta kode akses; status dapat dilacak dengan keduanya.
3. Admin login dan tidak melihat nomor WhatsApp di halaman maupun respons API.
4. Server menolak perubahan status tanpa bukti, transisi tidak sah, serta penolakan tanpa alasan.
5. Perubahan yang valid membuat antrean WhatsApp; demo menunjukkan pesan terkirim melalui penyedia yang tersedia atau secara jelas menunjukkan status gagal jika integrasi bermasalah.
6. Setiap laporan memicu evaluasi; hasil baru menghasilkan prompt aktif, sedangkan evaluasi duplikat atau tanpa pelajaran menghasilkan daftar kosong.
7. Prompt aktif muncul pada penyusunan system prompt untuk chat berikutnya; AI tidak dapat mengubah status.
8. Riwayat chat tidak disimpan permanen; kegagalan evaluasi atau WhatsApp tidak membatalkan laporan/perubahan status yang sudah berhasil.

## 14. Urutan pengerjaan

1. Sepakati payload, enum, format tools, dan penyedia WhatsApp/hosting.
2. Siapkan database, autentikasi, storage dan API utama.
3. Bangun chat → draft → konfirmasi → tiket sambil membuat UI admin secara paralel.
4. Sambungkan perubahan status dengan bukti, antrean WhatsApp, dan pelacakan.
5. Sambungkan evaluation agent, deduplikasi dan injeksi persona.
6. Uji alur ujung ke ujung, privasi API admin, retry/idempotensi, dan kegagalan layanan eksternal.





