# Route Handlers

POST /api/chat memakai createChatHandler dari fitur chat dan getAiServices dari src/lib/ai/services.ts. Sebelum wiring backend diisi, permintaan valid menghasilkan HTTP 503 AI_INTEGRATION_NOT_CONFIGURED. Tidak ada endpoint pengujian data/evaluasi lokal.

Dimas menyediakan service tiket, pelacakan, autentikasi/admin, monitoring dan worker sesuai PRD. Panduan: docs/ai/07-backend-dimas.md dan docs/ai/08-frontend-cahya.md. Jangan mengembalikan WhatsApp atau chat mentah pada API admin.
