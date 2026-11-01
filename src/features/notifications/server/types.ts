import type { ComplaintStatus } from '@/types/complaint';

export interface WhatsAppProviderConfig {
  apiUrl: string;
  apiToken: string;
  senderPhone?: string;
  isMock: boolean;
}

export interface WhatsAppSendInput {
  to: string; // Nomor WhatsApp penerima (format E.164, misal: +6281234567890)
  message: string;
  complaintId?: string;
}

export interface WhatsAppSendResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

export interface StatusNotificationPayload {
  complaintId: string;
  status: ComplaintStatus;
  note?: string | null;
  signal?: AbortSignal;
}
