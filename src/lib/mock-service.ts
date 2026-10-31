import {
  Complaint,
  ComplaintStatus,
  ComplaintDraft,
  PersonaPrompt,
  AiEvaluation,
  AiProviderConfig,
  ALLOWED_STATUS_TRANSITIONS,
  UpdateEvidence,
} from "@/types/complaint";

export const STORAGE_KEY_COMPLAINTS = "aduai_mock_complaints";
export const STORAGE_KEY_PROMPTS = "aduai_mock_persona_prompts";
export const STORAGE_KEY_EVALUATIONS = "aduai_mock_evaluations";
export const STORAGE_KEY_PROVIDER = "aduai_mock_ai_provider";
export const STORAGE_KEY_ADMIN_AUTH = "aduai_mock_admin_session";

export const INITIAL_COMPLAINTS: Complaint[] = [
  {
    id: "comp-001",
    ticketNumber: "ADU-2026-001284",
    accessCode: "7K9M-Q3PX",
    description: "Jalan berlubang cukup dalam (diameter ~60cm) tepat di depan gerbang SDN 01 Rawamangun. Saat hujan genangan menutupi lubang dan sudah dua pengendara motor terjatuh.",
    category: "Infrastruktur & Jalan",
    aiSummary: "Jalan berlubang berisiko kecelakaan di depan gerbang SDN 01 Rawamangun.",
    status: "NEW",
    whatsapp: "+6281234567890",
    createdAt: "2026-10-31T08:30:00.000Z",
    updatedAt: "2026-10-31T08:30:00.000Z",
    updates: [],
  },
  {
    id: "comp-002",
    ticketNumber: "ADU-2026-001192",
    accessCode: "4N8P-W2LK",
    description: "Tumpukan sampah liar di samping jembatan penyeberangan pasar induk menumpuk setinggi 1 meter dan berbau menyengat ke jalan warga.",
    category: "Kebersihan & Lingkungan",
    aiSummary: "Tumpukan sampah liar di bantaran jembatan pasar induk mengganggu sanitasi warga.",
    status: "ACCEPTED",
    whatsapp: "+6281298765432",
    createdAt: "2026-10-30T14:15:00.000Z",
    updatedAt: "2026-10-30T15:20:00.000Z",
    updates: [
      {
        id: "upd-001",
        complaintId: "comp-002",
        status: "ACCEPTED",
        note: "Laporan telah diverifikasi oleh tim patroli kebersihan wilayah. Penjadwalan truk pengangkut sampah sampah darurat dikoordinasikan untuk shift pagi besok.",
        evidence: [
          {
            id: "ev-001",
            fileName: "surat_disposisi_truk_kebersihan.pdf",
            mimeType: "application/pdf",
            fileSize: 345000,
          },
        ],
        notificationStatus: "SENT",
        createdAt: "2026-10-30T15:20:00.000Z",
      },
    ],
  },
  {
    id: "comp-003",
    ticketNumber: "ADU-2026-000981",
    accessCode: "9X2C-M5TY",
    description: "Lampu Penerangan Jalan Umum (PJU) padam sepanjang Jl. Merpati Raya sejauh 300 meter, sangat gelap dan membahayakan pengendara malam.",
    category: "Fasilitas Umum & PJU",
    aiSummary: "Lampu PJU padam 300 meter di Jl. Merpati Raya mengakibatkan jalan gelap.",
    status: "IN_PROGRESS",
    whatsapp: "+6281355556666",
    createdAt: "2026-10-29T19:40:00.000Z",
    updatedAt: "2026-10-30T10:00:00.000Z",
    updates: [
      {
        id: "upd-002",
        complaintId: "comp-003",
        status: "ACCEPTED",
        note: "Laporan diterima dan tiket kerja perbaikan kelistrikan diterbitkan.",
        evidence: [
          {
            id: "ev-002",
            fileName: "lembar_kerja_perbaikan_pju.pdf",
            mimeType: "application/pdf",
            fileSize: 210000,
          },
        ],
        notificationStatus: "SENT",
        createdAt: "2026-10-29T20:10:00.000Z",
      },
      {
        id: "upd-003",
        complaintId: "comp-003",
        status: "IN_PROGRESS",
        note: "Tim teknis lapangan sedang melakukan penggantian modul driver LED dan penelusuran korsleting kabel tanah di tiang nomor 12 sampai 18.",
        evidence: [
          {
            id: "ev-003",
            fileName: "foto_teknisi_lapangan_pju.jpg",
            mimeType: "image/jpeg",
            fileSize: 890000,
          },
        ],
        notificationStatus: "SENT",
        createdAt: "2026-10-30T10:00:00.000Z",
      },
    ],
  },
  {
    id: "comp-004",
    ticketNumber: "ADU-2026-000845",
    accessCode: "3B7V-K9QZ",
    description: "Drainase air tersumbat endapan sampah dan lumpur padat di Gang Kenanga RT 03. Setiap hujan lebat 30 menit, air meluap masuk ke pekarangan rumah.",
    category: "Drainase & Pengendalian Banjir",
    aiSummary: "Sedimentasi lumpur menyumbat drainase Gang Kenanga, menyebabkan genangan.",
    status: "RESOLVED",
    whatsapp: "+6281711122233",
    createdAt: "2026-10-28T09:12:00.000Z",
    updatedAt: "2026-10-29T16:00:00.000Z",
    updates: [
      {
        id: "upd-004",
        complaintId: "comp-004",
        status: "ACCEPTED",
        note: "Verifikasi lapangan telah dilakukan oleh Koordinator Pengawas Drainase.",
        evidence: [
          {
            id: "ev-004",
            fileName: "tinjauan_saluran_air.jpg",
            mimeType: "image/jpeg",
            fileSize: 450000,
          },
        ],
        notificationStatus: "SENT",
        createdAt: "2026-10-28T10:00:00.000Z",
      },
      {
        id: "upd-005",
        complaintId: "comp-004",
        status: "IN_PROGRESS",
        note: "Pengerukan lumpur sepanjang 80 meter menggunakan pompa hisap dan tenaga manual.",
        evidence: [
          {
            id: "ev-005",
            fileName: "pengerukan_sedimen.jpg",
            mimeType: "image/jpeg",
            fileSize: 720000,
          },
        ],
        notificationStatus: "SENT",
        createdAt: "2026-10-28T13:30:00.000Z",
      },
      {
        id: "upd-006",
        complaintId: "comp-004",
        status: "RESOLVED",
        note: "Pekerjaan pengerukan saluran selesai 100%. Aliran air kini mengalir lancar menuju saluran utama dan sedimen telah diangkut tuntas.",
        evidence: [
          {
            id: "ev-006",
            fileName: "berita_acara_penyelesaian_saluran.pdf",
            mimeType: "application/pdf",
            fileSize: 520000,
          },
        ],
        notificationStatus: "SENT",
        createdAt: "2026-10-29T16:00:00.000Z",
      },
    ],
  },
  {
    id: "comp-005",
    ticketNumber: "ADU-2026-000730",
    accessCode: "6L1P-D4JS",
    description: "Sengketa tapal batas pemasangan pagar antar pemilik rumah berdampingan di Kompleks Melati Indah nomor 14 dan 16.",
    category: "Hukum & Ketertiban",
    aiSummary: "Perselisihan batas tanah pribadi antar warga perorangan.",
    status: "REJECTED",
    whatsapp: "+6281899988877",
    createdAt: "2026-10-27T11:00:00.000Z",
    updatedAt: "2026-10-27T13:00:00.000Z",
    updates: [
      {
        id: "upd-007",
        complaintId: "comp-005",
        status: "REJECTED",
        note: "Laporan tidak dapat diproses lebih lanjut melalui portal dinas fasilitas publik.",
        rejectionReason: "Sengketa tapal batas tanah kepemilikan pribadi merupakan perkara perdata perorangan di luar kewenangan dinas operasional teknis kota. Disarankan diselesaikan melalui musyawarah RT/RW atau Kantor Pertanahan Nasional (ATR/BPN) setempat.",
        evidence: [
          {
            id: "ev-007",
            fileName: "surat_penolakan_dan_petunjuk_mediasi.pdf",
            mimeType: "application/pdf",
            fileSize: 310000,
          },
        ],
        notificationStatus: "SENT",
        createdAt: "2026-10-27T13:00:00.000Z",
      },
    ],
  },
];

export const INITIAL_PROMPTS: PersonaPrompt[] = [
  {
    id: "p-001",
    type: "POSITIVE",
    content: "Akui kekhawatiran dan rasa frustrasi pengadu dengan tenang, hangat, dan empatik pada tanggapan pertama.",
    isActive: true,
    createdAt: "2026-10-26T10:00:00.000Z",
  },
  {
    id: "p-002",
    type: "POSITIVE",
    content: "Gunakan kalimat yang jelas, ringkas, dan mudah dipahami masyarakat luas tanpa istilah birokrasi rumit.",
    isActive: true,
    createdAt: "2026-10-27T11:30:00.000Z",
  },
  {
    id: "p-003",
    type: "POSITIVE",
    content: "Bantu tanyakan patokan fisik atau detail lokasi yang spesifik secara santun bila informasi tempat belum jelas.",
    isActive: true,
    createdAt: "2026-10-28T09:15:00.000Z",
  },
  {
    id: "p-004",
    type: "NEGATIVE",
    content: "Jangan pernah menjanjikan batas waktu penyelesaian pasti (misalnya 'pasti beres besok') kepada warga.",
    isActive: true,
    createdAt: "2026-10-26T10:00:00.000Z",
  },
  {
    id: "p-005",
    type: "NEGATIVE",
    content: "Jangan gunakan singkatan kedinasan internal (misal: 'SOP Dishub', 'Kasi Sarpras') tanpa penjelasan transparan.",
    isActive: true,
    createdAt: "2026-10-27T14:00:00.000Z",
  },
  {
    id: "p-006",
    type: "NEGATIVE",
    content: "Jangan meminta nama lengkap, KTP, atau data pribadi sensitif selain nomor WhatsApp pengaduan.",
    isActive: true,
    createdAt: "2026-10-29T08:20:00.000Z",
  },
];

export const INITIAL_EVALUATIONS: AiEvaluation[] = [
  {
    id: "eval-001",
    ticketNumber: "ADU-2026-001284",
    summary: "Percakapan berjalan empatik. AI berhasil memandu pengadu menyebutkan lokasi jalan berlubang secara akurat. Pelajaran komunikasi sudah tercakup dalam persona positif.",
    hasNewLearning: false,
    status: "SUCCESS",
    createdAt: "2026-10-31T08:31:00.000Z",
  },
  {
    id: "eval-002",
    ticketNumber: "ADU-2026-001192",
    summary: "Ditemukan pola pengadu cemas akan bahaya penyakit dari sampah liar. Disarankan penegasan empati sanitasi lingkungan.",
    hasNewLearning: true,
    status: "SUCCESS",
    createdAt: "2026-10-30T14:16:30.000Z",
  },
  {
    id: "eval-003",
    ticketNumber: "ADU-2026-000981",
    summary: "AI merespons dengan baik mengenai PJU padam. Tidak ada friksi komunikasi baru.",
    hasNewLearning: false,
    status: "SUCCESS",
    createdAt: "2026-10-29T19:42:00.000Z",
  },
];

export const INITIAL_PROVIDER_CONFIG: AiProviderConfig = {
  configured: true,
  endpoint: "https://api.openai.com/v1/chat/completions",
  model: "gpt-4o-mini",
  hasApiKey: true,
  updatedAt: "2026-10-30T10:00:00.000Z",
};

// Safe helper for localStorage
function getLocalItem<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch {
    return fallback;
  }
}

function setLocalItem<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error("Failed to write to localStorage", err);
  }
}

// Generate random ticket number format: ADU-2026-XXXXXX
export function generateTicketNumber(): string {
  const num = Math.floor(100000 + Math.random() * 900000);
  return `ADU-2026-${num}`;
}

// Generate secure random access code: 4 chars - 4 chars (e.g. 7K9M-Q3PX)
export function generateAccessCode(): string {
  const chars = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"; // exclude easily confused 0, O, 1, I
  const part1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  const part2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `${part1}-${part2}`;
}

export const MockService = {
  // Complaints CRUD
  getComplaints(): Complaint[] {
    return getLocalItem<Complaint[]>(STORAGE_KEY_COMPLAINTS, INITIAL_COMPLAINTS);
  },

  getComplaintById(id: string): Complaint | undefined {
    const list = this.getComplaints();
    return list.find((c) => c.id === id);
  },

  getComplaintByTicket(ticketNumber: string): Complaint | undefined {
    const list = this.getComplaints();
    return list.find(
      (c) => c.ticketNumber.trim().toUpperCase() === ticketNumber.trim().toUpperCase()
    );
  },

  verifyTracking(ticketNumber: string, accessCode: string): { success: boolean; complaint?: Complaint; error?: string } {
    const complaint = this.getComplaintByTicket(ticketNumber);
    if (!complaint) {
      return { success: false, error: "Nomor tiket tidak ditemukan dalam sistem." };
    }
    const cleanInputCode = accessCode.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
    const cleanStoredCode = complaint.accessCode.replace(/[^A-Za-z0-9]/g, "").toUpperCase();

    if (cleanInputCode !== cleanStoredCode) {
      return { success: false, error: "Kode akses tidak sesuai. Pastikan kode diketik dengan benar." };
    }

    return { success: true, complaint };
  },

  createComplaint(draft: ComplaintDraft, conversation?: unknown[]): Complaint {
    void conversation;
    const complaints = this.getComplaints();
    const newTicket = generateTicketNumber();
    const newAccessCode = generateAccessCode();
    const now = new Date().toISOString();

    const newComplaint: Complaint = {
      id: "comp-" + Date.now(),
      ticketNumber: newTicket,
      accessCode: newAccessCode,
      description: draft.description,
      category: draft.category || "Layanan Umum",
      aiSummary: draft.aiSummary || draft.description,
      status: "NEW",
      whatsapp: draft.whatsapp,
      createdAt: now,
      updatedAt: now,
      updates: [],
    };

    const updatedList = [newComplaint, ...complaints];
    setLocalItem(STORAGE_KEY_COMPLAINTS, updatedList);

    // Also trigger mock evaluation log
    this.addAiEvaluation({
      id: "eval-" + Date.now(),
      ticketNumber: newTicket,
      summary: `Evaluasi otomatis untuk aduan ${newTicket}: Komunikasi pengadu jelas dan tersampaikan secara terstruktur.`,
      hasNewLearning: false,
      status: "SUCCESS",
      createdAt: now,
    });

    return newComplaint;
  },

  updateComplaintStatus(
    id: string,
    newStatus: ComplaintStatus,
    note?: string,
    rejectionReason?: string,
    evidenceFiles: { name: string; type: string; size: number }[] = []
  ): { success: boolean; error?: string; complaint?: Complaint } {
    const complaints = this.getComplaints();
    const index = complaints.findIndex((c) => c.id === id);
    if (index === -1) {
      return { success: false, error: "Aduan tidak ditemukan." };
    }

    const current = complaints[index];
    const allowed = ALLOWED_STATUS_TRANSITIONS[current.status];
    if (!allowed.includes(newStatus)) {
      return {
        success: false,
        error: `Transisi status tidak diizinkan: dari ${current.status} ke ${newStatus}.`,
      };
    }

    // Validation: REJECTED requires non-empty rejectionReason
    if (newStatus === "REJECTED" && (!rejectionReason || !rejectionReason.trim())) {
      return {
        success: false,
        error: "Status REJECTED wajib menyertakan alasan penolakan yang jelas.",
      };
    }

    // Validation: Admin transitions require at least one evidence file
    if (evidenceFiles.length === 0) {
      return {
        success: false,
        error: "Perubahan status admin wajib menyertakan minimal 1 bukti foto/dokumen resmi.",
      };
    }

    const now = new Date().toISOString();
    const evidence: UpdateEvidence[] = evidenceFiles.map((file, i) => ({
      id: `ev-${Date.now()}-${i}`,
      fileName: file.name,
      mimeType: file.type,
      fileSize: file.size,
      createdAt: now,
    }));

    const updateRecord = {
      id: `upd-${Date.now()}`,
      complaintId: id,
      status: newStatus,
      note: note?.trim() || undefined,
      rejectionReason: newStatus === "REJECTED" ? rejectionReason?.trim() : undefined,
      evidence,
      notificationStatus: "SENT" as const, // simulated automated WhatsApp dispatch
      createdAt: now,
    };

    const updatedComplaint: Complaint = {
      ...current,
      status: newStatus,
      updatedAt: now,
      updates: [...current.updates, updateRecord],
    };

    complaints[index] = updatedComplaint;
    setLocalItem(STORAGE_KEY_COMPLAINTS, complaints);

    return { success: true, complaint: updatedComplaint };
  },

  getDashboardMetrics() {
    const list = this.getComplaints();
    const counts = {
      TOTAL: list.length,
      NEW: 0,
      ACCEPTED: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      REJECTED: 0,
    };

    list.forEach((c) => {
      if (c.status in counts) {
        counts[c.status]++;
      }
    });

    return counts;
  },

  // Persona Prompts
  getPersonaPrompts(): PersonaPrompt[] {
    return getLocalItem<PersonaPrompt[]>(STORAGE_KEY_PROMPTS, INITIAL_PROMPTS);
  },

  togglePersonaPrompt(id: string): PersonaPrompt[] {
    const prompts = this.getPersonaPrompts();
    const updated = prompts.map((p) => (p.id === id ? { ...p, isActive: !p.isActive } : p));
    setLocalItem(STORAGE_KEY_PROMPTS, updated);
    return updated;
  },

  addPersonaPrompt(type: "POSITIVE" | "NEGATIVE", content: string): PersonaPrompt {
    const prompts = this.getPersonaPrompts();
    const newPrompt: PersonaPrompt = {
      id: "p-" + Date.now(),
      type,
      content: content.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    const updated = [newPrompt, ...prompts];
    setLocalItem(STORAGE_KEY_PROMPTS, updated);
    return newPrompt;
  },

  deletePersonaPrompt(id: string): PersonaPrompt[] {
    const prompts = this.getPersonaPrompts();
    const updated = prompts.filter((p) => p.id !== id);
    setLocalItem(STORAGE_KEY_PROMPTS, updated);
    return updated;
  },

  // AI Evaluations
  getAiEvaluations(): AiEvaluation[] {
    return getLocalItem<AiEvaluation[]>(STORAGE_KEY_EVALUATIONS, INITIAL_EVALUATIONS);
  },

  addAiEvaluation(evaluation: AiEvaluation) {
    const evals = this.getAiEvaluations();
    const updated = [evaluation, ...evals];
    setLocalItem(STORAGE_KEY_EVALUATIONS, updated);
  },

  // AI Provider Configuration
  getAiProviderConfig(): AiProviderConfig {
    return getLocalItem<AiProviderConfig>(STORAGE_KEY_PROVIDER, INITIAL_PROVIDER_CONFIG);
  },

  updateAiProviderConfig(data: { endpoint: string; model: string; apiKey?: string }): AiProviderConfig {
    const current = this.getAiProviderConfig();
    const updated: AiProviderConfig = {
      configured: true,
      endpoint: data.endpoint,
      model: data.model,
      hasApiKey: data.apiKey && data.apiKey.trim() ? true : current.hasApiKey,
      updatedAt: new Date().toISOString(),
    };
    setLocalItem(STORAGE_KEY_PROVIDER, updated);
    return updated;
  },

  // Admin Auth Mock Session
  isAdminLoggedIn(): boolean {
    return getLocalItem<boolean>(STORAGE_KEY_ADMIN_AUTH, false);
  },

  loginAdmin(email: string, pass: string): boolean {
    if (email === "admin@aduai.id" && pass === "admin123") {
      setLocalItem(STORAGE_KEY_ADMIN_AUTH, true);
      return true;
    }
    // Allow any demo admin password for quick testing convenience
    if (email.includes("admin")) {
      setLocalItem(STORAGE_KEY_ADMIN_AUTH, true);
      return true;
    }
    return false;
  },

  logoutAdmin(): void {
    setLocalItem(STORAGE_KEY_ADMIN_AUTH, false);
  },
};
