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

