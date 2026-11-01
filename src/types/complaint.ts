export const COMPLAINT_STATUSES = [
  "NEW",
  "ACCEPTED",
  "IN_PROGRESS",
  "RESOLVED",
  "REJECTED",
] as const;

export type ComplaintStatus = (typeof COMPLAINT_STATUSES)[number];

export interface ComplaintDraft {
  description: string;
  category: string | null;
  aiSummary: string;
  whatsapp: string;
}

export const ALLOWED_STATUS_TRANSITIONS: Readonly<
  Record<ComplaintStatus, readonly ComplaintStatus[]>
> = {
  NEW: ["ACCEPTED", "REJECTED"],
  ACCEPTED: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
  RESOLVED: [],
  REJECTED: [],
};

export interface UpdateEvidence {
  id: string;
  fileName: string;
  mimeType: string;
  fileSize?: number;
  url?: string;
  createdAt?: string;
}

export interface ComplaintUpdate {
  id: string;
  complaintId?: string;
  status: ComplaintStatus;
  note?: string;
  rejectionReason?: string;
  evidence: UpdateEvidence[];
  notificationStatus?: "PENDING" | "SENT" | "FAILED";
  createdAt: string;
}

export interface Complaint {
  id: string;
  ticketNumber: string;
  accessCode: string; // disimpan aman di server; tidak diekspos sembarangan
  description: string;
  category: string;
  aiSummary: string;
  status: ComplaintStatus;
  whatsapp?: string; // hanya untuk konfirmasi pengadu, TIDAK PERNAH diekspos ke tampilan admin
  createdAt: string;
  updatedAt: string;
  updates: ComplaintUpdate[];
}

export interface PersonaPrompt {
  id: string;
  evaluationId?: string;
  type: "POSITIVE" | "NEGATIVE";
  content: string;
  isActive: boolean;
  createdAt: string;
}

export interface AiEvaluation {
  id: string;
  ticketNumber: string;
  summary: string;
  hasNewLearning: boolean;
  status: "SUCCESS" | "PENDING" | "FAILED";
  createdAt: string;
}

export interface AiProviderConfig {
  configured: boolean;
  endpoint: string;
  model: string;
  hasApiKey: boolean;
  updatedAt?: string;
}

// Receipt hanya dibuat adapter penyimpanan setelah laporan benar-benar tersimpan.
export interface SubmissionReceipt {
  complaintId: string;
  ticketNumber: string; // Nomor tiket 6 digit
  accessCode?: string;  // Opsional: pelacakan publik kini cukup menggunakan nomor tiket
  status: ComplaintStatus;
  createdAt: string;
}

export interface SubmissionContext {
  sessionId: string;
  idempotencyKey: string;
}

// Hasil publik sesudah tiket diverifikasi backend.
export interface ComplaintTrackingResult {
  ticketNumber: string;
  status: ComplaintStatus;
  summary: string;
  updates: { status: ComplaintStatus; note: string; createdAt: string }[];
}
