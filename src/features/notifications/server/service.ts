import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { sendWhatsAppMessage } from './provider';
import { formatStatusNotificationMessage, formatSubmissionNotificationMessage } from './template';
import type { StatusNotificationPayload, WhatsAppSendResult } from './types';

/** Nomor pengadu hanya dibaca di server untuk mengirim pesan. */
export async function dispatchStatusNotification(payload: StatusNotificationPayload): Promise<WhatsAppSendResult> {
  const { data: complaint, error } = await getSupabaseAdmin()
    .from('complaint')
    .select('ticket_number, reporter_whatsapp, ai_summary')
    .eq('id', payload.complaintId)
    .maybeSingle();

  if (error || !complaint) return { success: false, error: 'COMPLAINT_NOT_FOUND' };

  return sendWhatsAppMessage({
    to: complaint.reporter_whatsapp,
    complaintId: payload.complaintId,
    message: formatStatusNotificationMessage({
      ticketNumber: complaint.ticket_number,
      status: payload.status,
      note: payload.note,
      evidenceUrl: payload.evidenceUrl,
      aiSummary: complaint.ai_summary,
    }),
  });
}

/** Pesan pendaftaran memakai koneksi Fonnte yang sama dengan pembaruan status. */
export async function dispatchSubmissionNotification(complaintId: string): Promise<WhatsAppSendResult> {
  const { data: complaint, error } = await getSupabaseAdmin()
    .from('complaint')
    .select('ticket_number, reporter_whatsapp, ai_summary')
    .eq('id', complaintId)
    .maybeSingle();

  if (error || !complaint) return { success: false, error: 'COMPLAINT_NOT_FOUND' };

  return sendWhatsAppMessage({
    to: complaint.reporter_whatsapp,
    complaintId,
    message: formatSubmissionNotificationMessage({
      ticketNumber: complaint.ticket_number,
      aiSummary: complaint.ai_summary,
    }),
  });
}
