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
  accessCode: string; // stored hashed on server; stored in mock for guest verification
  description: string;
  category: string;
  aiSummary: string;
  status: ComplaintStatus;
  whatsapp?: string; // only for guest confirmation, NEVER exposed to admin view
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
