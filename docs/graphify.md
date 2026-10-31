# Graphify untuk AduAI

Graphify memetakan kode dan dokumentasi agar alur AI serta titik integrasi bisa ditelusuri. Graph ini alat pengembangan; bukan knowledge/RAG yang dipakai agent pengaduan dan bukan fitur self-learning produk.

## Hasil

- `graphify-out/graph.html`: peta interaktif.
- `graphify-out/GRAPH_REPORT.md`: ringkasan, kelompok modul, serta audit hubungan.
- `graphify-out/graph.json`: graph untuk query dan penelusuran.

File `.local/`, secret, node_modules, hasil build, dan berkas yang diabaikan Git tidak ikut dipindai. `.graphifyignore` juga mengabaikan lima ikon SVG bawaan framework. Artefak graph dapat berisi cuplikan kode/dokumen; jangan menambahkan konfigurasi privat ke corpus.

## Pemakaian dari root proyek

```powershell
graphify query "Bagaimana runChatAgent memanggil completeWithConfig dan submit?"
graphify explain "runChatAgent"
graphify path "createChatHandler" "runChatAgent"
graphify update .
```

`graphify update .` memperbarui struktur kode. Untuk perubahan dokumen/kontrak, minta skill `/graphify . --update` agar ekstraksi semantik dokumen juga diperbarui. Graph dapat tertinggal setelah perubahan; cocokkan hasilnya dengan sumber saat akan mengedit.

Graphify sudah tersedia pada komputer Mada. Anggota lain membutuhkan instalasi CLI tersendiri jika ingin query di terminal; hasil HTML dan Markdown dapat dibaca langsung. Tidak ada hook commit atau proses watch yang dipasang. Tidak ada commit/push otomatis.
