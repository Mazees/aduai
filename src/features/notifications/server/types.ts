import type { ComplaintStatus } from '@/types/complaint';

export interface WhatsAppSendInput {
  to: string;
  message: string;
  complaintId?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface StatusNotificationPayload {
  complaintId: string;
  status: ComplaintStatus;
  note?: string | null;
  evidenceUrl: string;
}
