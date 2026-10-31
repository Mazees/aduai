import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { sendWhatsAppMessage } from './provider';
import {
  formatStatusNotificationMessage,
  formatSubmissionNotificationMessage,
} from './template';
import type { StatusNotificationPayload, WhatsAppSendResult } from './types';

/**
 * Mengirim notifikasi WhatsApp kepada pelapor saat status laporan diperbarui oleh petugas
 * Privasi ketat: nomor WhatsApp hanya dibaca sementara di memori server dan dikirim ke gateway
 */
export async function dispatchStatusNotification(
  payload: StatusNotificationPayload
): Promise<WhatsAppSendResult> {
  const supabase = getSupabaseAdmin();

  // 1. Ambil data aduan dan nomor WhatsApp pelapor secara privat dari database
  const { data: complaint, error: compErr } = await supabase
    .from('complaint')
    .select('ticket_number, reporter_whatsapp, ai_summary')
    .eq('id', payload.complaintId)
    .maybeSingle();

  if (compErr || !complaint) {
    return {
      success: false,
      error: 'COMPLAINT_NOT_FOUND',
    };
  }

  // 2. Susun pesan resmi AduAI dengan bahasa yang sopan dan jelas
  const message = formatStatusNotificationMessage({
    ticketNumber: complaint.ticket_number,
    status: payload.status,
    note: payload.note,
    aiSummary: complaint.ai_summary,
  });

  // 3. Kirim via WhatsApp Provider
  return await sendWhatsAppMessage(
    {
      to: complaint.reporter_whatsapp,
      message,
      complaintId: payload.complaintId,
    },
    payload.signal
  );
}

/**
 * Mengirim notifikasi WhatsApp konfirmasi saat aduan pertama kali berhasil didaftarkan
 */
export async function dispatchSubmissionNotification(
  complaintId: string,
  signal?: AbortSignal
): Promise<WhatsAppSendResult> {
  const supabase = getSupabaseAdmin();

  const { data: complaint, error: compErr } = await supabase
    .from('complaint')
    .select('ticket_number, reporter_whatsapp, ai_summary')
    .eq('id', complaintId)
    .maybeSingle();

  if (compErr || !complaint) {
    return {
      success: false,
      error: 'COMPLAINT_NOT_FOUND',
    };
  }

  const message = formatSubmissionNotificationMessage({
    ticketNumber: complaint.ticket_number,
    aiSummary: complaint.ai_summary,
  });

  return await sendWhatsAppMessage(
    {
      to: complaint.reporter_whatsapp,
      message,
      complaintId,
    },
    signal
  );
}
