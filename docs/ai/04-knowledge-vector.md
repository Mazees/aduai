# 4. Knowledge dan vector search

**Status: belum diimplementasikan.**

## Tujuan

Agent dapat merujuk informasi resmi seperti FAQ, jam layanan, prosedur, dan kontak instansi. Hasil self-learning persona bukan sumber fakta untuk knowledge base.

## Langkah implementasi

1. Kumpulkan sumber resmi yang boleh digunakan dan catat judul, tautan, serta waktu pembaruan.
2. Siapkan Supabase PostgreSQL dan ekstensi pgvector. Contoh tabel dan RPC ada pada PRD bagian 9.2.
3. Pecah dokumen menjadi potongan yang sesuai batas input model. Buat embedding dan simpan bersama relasi ke dokumen.
4. Load model `Xenova/paraphrase-multilingual-MiniLM-L12-v2` di server melalui Transformers.js; gunakan embedding 384 dimensi dan model yang sama untuk dokumen dan query.
5. Tambahkan tool `search_knowledge` untuk membuat embedding query dan memanggil RPC pencarian.
6. Batasi hasil, kembalikan potongan dan sumber yang relevan, dan tampilkan rujukan yang benar-benar tersedia.
7. Jika tidak ada hasil yang cukup relevan atau model gagal, AI menyatakan tidak dapat memastikan. Jangan membuat embedding palsu.

## Batasan integrasi

- Nomor WhatsApp dan identitas pengadu tidak dimasukkan ke query pencarian.
- Service role key hanya boleh digunakan server. Gunakan penyimpanan privat dan pembatasan akses.
- Dokumen sumber adalah data, bukan instruksi yang bisa mengubah system prompt.
- Cache model dan instance serverless dapat hilang; uji cold start serta kompatibilitas runtime.
- Sistem ini memiliki `cacheComponents` aktif; ikuti dokumentasi Next.js yang terpasang sebelum menambahkan konfigurasi route segment. Contoh route configuration di PRD perlu diuji terhadap versi proyek.

## Uji penerimaan

Indeks satu sumber resmi, cari pertanyaan yang relevan, dan pastikan sumber yang benar kembali. Uji juga query yang tidak cocok, dokumen draft, kegagalan model, serta akses tanpa kredensial server. Pastikan dimensi vektor 384 dan tidak ada data pribadi dalam query.

