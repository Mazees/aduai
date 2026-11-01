import 'server-only';
import crypto from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { redactContacts, normalizeWhatsapp } from '@/lib/ai/privacy';
import { dispatchSubmissionNotification } from '@/features/notifications/server/service';
import type {
  ComplaintDraft,
  SubmissionContext,
  SubmissionReceipt,
  ComplaintTrackingResult,
  ComplaintStatus,
} from '@/types/complaint';

/**
 * Generate nomor tiket 6 digit unik (contoh: '782914')
 */
function generateTicketNumber(): string {
  const num = crypto.randomInt(100000, 1000000);
  return num.toString();
}

/**
 * Menghitung hash payload untuk validasi kunci idempotensi
 */
function computePayloadHash(draft: ComplaintDraft, sessionId: string): string {
  const normalized = JSON.stringify({
    description: draft.description.trim(),
    category: draft.category,
    aiSummary: draft.aiSummary.trim(),
    whatsapp: normalizeWhatsapp(draft.whatsapp),
    sessionId,
  });
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Menyimpan draft laporan terkonfirmasi dari AI ke database
 * Menghasilkan tiket 6 digit unik, mendukung idempotensi, penyamaran identitas, dan proteksi nomor WhatsApp
 */
export async function submitComplaint(
  draft: ComplaintDraft,
  context: SubmissionContext,
  signal?: AbortSignal
): Promise<SubmissionReceipt> {
  if (signal?.aborted) throw signal.reason;

  const supabase = getSupabaseAdmin();
  const requestHash = computePayloadHash(draft, context.sessionId);

  // 1. Periksa Kunci Idempotensi langsung di tabel complaint
  if (context.idempotencyKey) {
    if (context.idempotencyKey.length > 128 || !/^[a-zA-Z0-9_\-.:]+$/.test(context.idempotencyKey)) {
      throw new Error('INVALID_IDEMPOTENCY_KEY');
    }

    const { data: existing, error: keyErr } = await supabase
      .from('complaint')
      .select('id, ticket_number, status, created_at, request_hash')
      .eq('idempotency_key', context.idempotencyKey)
      .maybeSingle();

    if (!keyErr && existing) {
      if (existing.request_hash === requestHash) {
        // Idempotent hit: kembalikan receipt yang sama
        return {
          complaintId: existing.id,
          ticketNumber: existing.ticket_number,
          status: existing.status as ComplaintStatus,
          createdAt: existing.created_at,
        };
      }
      // Payload berbeda dengan key yang sama -> Lempar konflik idempotensi
      throw new Error('IDEMPOTENCY_CONFLICT');
    }
  }

  // 2. Sanitasi & Penyamaran Konten untuk perlindungan privasi
  const sanitizedDescription = redactContacts(draft.description).trim().slice(0, 5000);
  const sanitizedSummary = redactContacts(draft.aiSummary).trim().slice(0, 1000);
  const normalizedWa = normalizeWhatsapp(draft.whatsapp);
  const category = (draft.category || 'Umum').trim().slice(0, 100);

  if (sanitizedDescription.length < 5) {
    throw new Error('INVALID_DRAFT_DESCRIPTION');
  }

  // Validasi format nomor telepon internasional / E.164
  if (!/^\+?[1-9]\d{7,14}$/.test(normalizedWa)) {
    throw new Error('INVALID_WHATSAPP_NUMBER');
  }

  // 3. Generate tiket 6 digit unik
  let ticketNumber = generateTicketNumber();

  // 4. Simpan ke tabel complaint (5 tabel revisi 003)
  const { data: inserted, error: insertError } = await supabase
    .from('complaint')
    .insert({
      ticket_number: ticketNumber,
      idempotency_key: context.idempotencyKey || null,
      request_hash: requestHash,
      reporter_whatsapp: normalizedWa, // Disimpan di kolom terproteksi, tidak diekspos ke admin
      description: sanitizedDescription,
      category,
      ai_summary: sanitizedSummary,
      status: 'NEW',
    })
    .select('id, ticket_number, status, created_at')
    .single();

  let finalRecord = inserted;

  if (insertError || !finalRecord) {
    // Jika nomor tiket bertabrakan, retry generate tiket 6 digit baru
    if (insertError?.code === '23505') {
      const existing = await supabase.from('complaint').select('id, ticket_number, status, created_at, request_hash').eq('idempotency_key', context.idempotencyKey).maybeSingle();
      if (existing.data) {
        if (existing.data.request_hash !== requestHash) throw new Error('IDEMPOTENCY_CONFLICT');
        return { complaintId: existing.data.id, ticketNumber: existing.data.ticket_number, status: existing.data.status as ComplaintStatus, createdAt: existing.data.created_at };
      }
      if (existing.error) throw new Error('DATABASE_READ_FAILED');
      ticketNumber = generateTicketNumber();
      const retry = await supabase
        .from('complaint')
        .insert({
          ticket_number: ticketNumber,
          idempotency_key: context.idempotencyKey || null,
          request_hash: requestHash,
          reporter_whatsapp: normalizedWa,
          description: sanitizedDescription,
          category,
          ai_summary: sanitizedSummary,
          status: 'NEW',
        })
        .select('id, ticket_number, status, created_at')
        .single();

      if (retry.error || !retry.data) {
        throw new Error(`DATABASE_INSERT_FAILED: ${retry.error?.message}`);
      }
      finalRecord = retry.data;
    } else {
      throw new Error(`DATABASE_INSERT_FAILED: ${insertError?.message}`);
    }
  }

  if (!finalRecord) {
    throw new Error('DATABASE_INSERT_FAILED: Data aduan tidak tersimpan');
  }

  const receipt: SubmissionReceipt = {
    complaintId: finalRecord.id,
    ticketNumber: finalRecord.ticket_number,
    status: 'NEW',
    createdAt: finalRecord.created_at,
  };

  // Kirim notifikasi WhatsApp pendaftaran aduan (Non-blocking / resilient)
  try {
    await dispatchSubmissionNotification(finalRecord.id);
  } catch (waErr) {
    console.warn('[SubmissionNotification] Gagal mengirim pesan WA konfirmasi pendaftaran:', (waErr as Error).message);
  }

  return receipt;
}

/**
 * Melacak status aduan cukup menggunakan nomor tiket 6 digit
 * Memastikan data publik terbebas dari nomor WhatsApp atau identitas pelapor
 */
export async function trackComplaint(
  input: { ticket: string },
  signal?: AbortSignal
): Promise<ComplaintTrackingResult> {
  if (signal?.aborted) throw signal.reason;

  const normalizedTicket = input.ticket.trim().toUpperCase();

  const supabase = getSupabaseAdmin();

  // 1. Ambil data aduan berdasarkan nomor tiket 6 digit
  const { data: complaint, error: compErr } = await supabase
    .from('complaint')
    .select('id, ticket_number, category, description, ai_summary, status, created_at')
    .eq('ticket_number', normalizedTicket)
    .maybeSingle();

  // Selalu gunakan pesan generik bila tidak ditemukan
  if (compErr || !complaint) {
    throw new Error('TICKET_NOT_FOUND');
  }

  // 2. Ambil riwayat pembaruan status dari tabel evidence
  const { data: updates } = await supabase
    .from('evidence')
    .select('id, status, note, storage_path, created_at')
    .eq('complaint_id', complaint.id)
    .order('created_at', { ascending: true });

  const formattedUpdates = (updates || []).map((u) => ({
    id: u.id,
    status: u.status as ComplaintStatus,
    note: u.note || '',
    createdAt: u.created_at,
    evidence: u.storage_path ? [{ id: u.id, url: `/api/reports/${encodeURIComponent(complaint.ticket_number)}/evidence/${u.id}`, fileName: 'Bukti' }] : [],
  }));

  return {
    ticketNumber: complaint.ticket_number,
    status: complaint.status as ComplaintStatus,
    summary: complaint.ai_summary,
    description: complaint.description,
    category: complaint.category,
    createdAt: complaint.created_at,
    updates: formattedUpdates,
  };
}
