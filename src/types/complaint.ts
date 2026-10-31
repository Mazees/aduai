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
