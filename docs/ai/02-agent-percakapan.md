# 2. Agent percakapan dan Main Knowledge

1. Handler memvalidasi pesan, draft, sesi, dan header idempotensi.
2. Backend memasok seluruh `AgentDependencies`: complete, submit, mainKnowledge, persona, search, dan track.
3. Agent memuat Main Knowledge dan persona aktif, lalu menyusun satu system prompt besar beserta draft dan riwayat sementara.
4. Provider mengirim token dan permintaan tool. Agent memvalidasi tool, menjalankannya, lalu mengirim hasil kembali ke model.
5. Loop berhenti setelah jawaban final atau batas 6 putaran, 12 tool call, atau 120 detik.
6. Setelah konfirmasi pada draft lengkap, server memanggil service submit dan callback evaluasi; klien menerima receipt.

Tools percakapan: `create_complaint_draft`, `search_knowledge`, dan `get_complaint_status`. Pembuatan tiket dilakukan server setelah persetujuan, bukan keputusan bebas model. Agent tidak mengubah status laporan.

`runChatAgent(history, initialDraft, emit, signal, dependencies, options)` membutuhkan dependency eksplisit dan `options.onSubmitted`. Tidak ada default adapter atau penyimpanan chat. Signature lengkap ada di `src/features/chat/server/agent.ts`.

## Main Knowledge

`dependencies.mainKnowledge(signal)` mengembalikan teks instansi. `validateMainKnowledge` di `src/lib/ai/main-knowledge.ts` membatasi input ke 3000 karakter berdasarkan JS `.length`, termasuk spasi dan baris baru. Teks kosong diperbolehkan; input berlebih ditolak, tidak dipotong.

Urutan konteks: aturan dasar -> Main Knowledge -> persona POSITIVE/NEGATIVE. Teks dimuat setiap giliran dan langsung diinjeksi tanpa vector search. Isinya adalah rujukan, tidak dapat mengganti aturan keamanan atau kewenangan AI.

Gunakan untuk wilayah layanan dan informasi instansi agar AI tidak menanyakan rincian yang sudah jelas. Agent tetap tidak menganggap cakupan wilayah sebagai alamat kejadian. Jika perlu, agent menanyakan satu detail lokasi yang paling berguna.

Dimas menyediakan GET/PUT `/api/admin/ai/main-knowledge` sesuai PRD bagian 8.10. Cahya membuat textarea dan penghitung karakter. Kode validasi/injeksi sudah tersedia; API, penyimpanan, serta halaman pengaturan belum dibuat oleh modul AI.

## Privasi

Draft dinormalisasi dan disamarkan kembali di server. Regex mengenali kontak serta nama yang disebut dengan pola eksplisit; tidak menjamin semua identitas terdeteksi. Backend harus memastikan konten admin anonim dan menyimpan WhatsApp pada area privat terpisah. Hasil tracking harus memakai `ComplaintTrackingResult` yang hanya berisi data publik.
