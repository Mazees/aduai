import 'server-only';
import crypto from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { redactContacts, normalizeWhatsapp } from '@/lib/ai/privacy';
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

  // 1. Periksa Kunci Idempotensi untuk mencegah pengiriman ganda
  if (context.idempotencyKey) {
    if (context.idempotencyKey.length > 128 || !/^[a-zA-Z0-9_\-.:]+$/.test(context.idempotencyKey)) {
      throw new Error('INVALID_IDEMPOTENCY_KEY');
    }

    const { data: existingKey, error: keyErr } = await supabase
      .from('idempotency_keys')
      .select('request_hash, response_data, expires_at')
      .eq('key', context.idempotencyKey)
      .maybeSingle();

    if (!keyErr && existingKey) {
      if (existingKey.request_hash === requestHash && existingKey.response_data) {
        // Idempotent hit: kembalikan receipt yang sama
        return existingKey.response_data as unknown as SubmissionReceipt;
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

  // 4. Simpan ke tabel complaints (tanpa access_code_hash)
  const { data: inserted, error: insertError } = await supabase
    .from('complaints')
    .insert({
      ticket_number: ticketNumber,
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
      ticketNumber = generateTicketNumber();
      const retry = await supabase
        .from('complaints')
        .insert({
          ticket_number: ticketNumber,
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

  // 5. Simpan receipt ke tabel idempotency_keys
  if (context.idempotencyKey) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await supabase.from('idempotency_keys').insert({
      key: context.idempotencyKey,
      operation: 'SUBMIT_COMPLAINT',
      request_hash: requestHash,
      response_data: receipt as unknown as Record<string, unknown>,
      expires_at: expiresAt,
    });
  }

  return receipt;
}

/**
 * Melacak status aduan cukup menggunakan nomor tiket 6 digit
 * Memastikan data publik terbebas dari nomor WhatsApp atau identitas pelapor
 */
export async function trackComplaint(
  input: { ticket: string; accessCode?: string },
  signal?: AbortSignal
): Promise<ComplaintTrackingResult> {
  if (signal?.aborted) throw signal.reason;

  const normalizedTicket = input.ticket.trim().toUpperCase();

  const supabase = getSupabaseAdmin();

  // 1. Ambil data aduan berdasarkan nomor tiket 6 digit
  const { data: complaint, error: compErr } = await supabase
    .from('complaints')
    .select('id, ticket_number, ai_summary, status')
    .eq('ticket_number', normalizedTicket)
    .maybeSingle();

  // Selalu gunakan pesan generik bila tidak ditemukan
  if (compErr || !complaint) {
    throw new Error('TICKET_NOT_FOUND');
  }

  // 2. Ambil riwayat pembaruan status
  const { data: updates } = await supabase
    .from('complaint_updates')
    .select('status, note, created_at')
    .eq('complaint_id', complaint.id)
    .order('created_at', { ascending: true });

  const formattedUpdates = (updates || []).map((u) => ({
    status: u.status as ComplaintStatus,
    note: u.note || '',
    createdAt: u.created_at,
  }));

  return {
    ticketNumber: complaint.ticket_number,
    status: complaint.status as ComplaintStatus,
    summary: complaint.ai_summary,
    updates: formattedUpdates,
  };
}
