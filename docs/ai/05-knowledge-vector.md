# 5. Knowledge dan vector search

1. Dimas menyiapkan dokumen resmi terpublikasi dan memecah teks melalui `chunkDocument` sebelum indexing.
2. Buat embedding potongan dengan `generateEmbedding`, lalu simpan teks, metadata, dan vector di backend.
3. Inject `createKnowledgeSearch(knowledgeRepository)` ke `AgentDependencies.search`.
4. Fungsi pencarian menyamarkan kontak pada query, membuat embedding, lalu memanggil `KnowledgeRepository.match(vector, options, signal)`.
5. Repository hanya mengembalikan sumber terpublikasi. Agent meminta maksimal 3 hasil, threshold awal 0.35; threshold perlu diuji dengan corpus nyata.
6. Model membaca hasil sebagai rujukan dan klien menerima judul/link sumber di `done.sources`.

`KnowledgeResult`: documentId, chunkId, title, excerpt, sourceUrl, score. Signature repository berada di `src/features/knowledge/server/search.ts`. Tidak ada repository JSON, koleksi contoh, atau pencarian vector dalam memori aplikasi.

Model tetap `Xenova/paraphrase-multilingual-MiniLM-L12-v2`: 384 dimensi, `@huggingface/transformers`, dtype q8, CPU, mean pooling, normalisasi. Package dimuat saat diperlukan melalui Node.js runtime; Promise singleton dipakai ulang dan cache model memakai direktori temporary. Ini cache model, bukan penyimpanan data aduan.

`chunkDocument` menggunakan 96 token per potongan dengan langkah 80 token. Model indexing dan query wajib sama. Dimensi/metric/RPC/Supabase serta SQL dikerjakan Dimas. Kegagalan load tidak menghasilkan vektor palsu. Deployment model di production masih perlu diverifikasi, termasuk cold start dan packaging dependency native; lihat PRD bagian 9.2.
