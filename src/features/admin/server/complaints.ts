import 'server-only';
import crypto from 'node:crypto';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { ALLOWED_STATUS_TRANSITIONS, type ComplaintStatus } from '@/types/complaint';
import { dispatchStatusNotification } from '@/features/notifications/server/service';

export interface AdminComplaintListItem {
  id: string;
  ticketNumber: string;
  category: string | null;
  aiSummary: string;
  status: ComplaintStatus;
  createdAt: string;
}

export interface AdminComplaintDetail {
  id: string;
  ticketNumber: string;
  description: string;
  category: string | null;
  aiSummary: string;
  status: ComplaintStatus;
  createdAt: string;
  updates: {
    id: string;
    status: ComplaintStatus;
    note: string | null;
    rejectionReason: string | null;
    createdAt: string;
    evidence: {
      id: string;
      fileName: string;
      mimeType: string;
      sizeBytes: number;
    }[];
  }[];
}

export interface UpdateComplaintInput {
  complaintId: string;
  adminId: string;
  targetStatus: ComplaintStatus;
  note?: string;
  rejectionReason?: string;
  files: {
    buffer: Buffer;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
  }[];
  idempotencyKey?: string;
}

export interface UpdateComplaintResult {
  id: string;
  complaintId: string;
  status: ComplaintStatus;
  note: string | null;
  evidence: { id: string; fileName: string; mimeType: string }[];
  notificationStatus: 'QUEUED' | 'FAILED';
  createdAt: string;
}

/**
 * 1. Mengambil statistik status laporan untuk admin dashboard
 */
export async function getDashboardCounts(): Promise<{
  total: number;
  counts: Record<ComplaintStatus, number>;
}> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from('complaint')
    .select('status');

  if (error || !data) {
    throw new Error(`DATABASE_ERROR: ${error?.message}`);
  }

  const counts: Record<ComplaintStatus, number> = {
    NEW: 0,
    ACCEPTED: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    REJECTED: 0,
  };

  data.forEach((row: { status: ComplaintStatus }) => {
    if (counts[row.status] !== undefined) {
      counts[row.status] += 1;
    }
  });

  return {
    total: data.length,
    counts,
  };
}

/**
 * 2. Mengambil daftar laporan dengan paginasi dan filter status
 * Menegakkan aturan privasi ketat: nomor WhatsApp tidak pernah diambil/diekspos
 */
export async function listComplaints(params: {
  status?: ComplaintStatus;
  page?: number;
  limit?: number;
}): Promise<{
  items: AdminComplaintListItem[];
  pagination: { page: number; limit: number; total: number };
}> {
  const supabase = getSupabaseAdmin();
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
  const offset = (page - 1) * limit;

  let query = supabase
    .from('complaint')
    .select('id, ticket_number, category, ai_summary, status, created_at', { count: 'exact' });

  if (params.status) {
    query = query.eq('status', params.status);
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error || !data) {
    throw new Error(`DATABASE_ERROR: ${error?.message}`);
  }

  const items: AdminComplaintListItem[] = data.map((row: any) => ({
    id: row.id,
    ticketNumber: row.ticket_number,
    category: row.category,
    aiSummary: row.ai_summary,
    status: row.status,
    createdAt: row.created_at,
  }));

  return {
    items,
    pagination: {
      page,
      limit,
      total: count || 0,
    },
  };
}

/**
 * 3. Mengambil detail lengkap satu laporan beserta riwayat update & buktinya
 * PRIVASI: Kolom reporter_whatsapp di-exclude secara eksplisit
 */
export async function getComplaintDetail(id: string): Promise<AdminComplaintDetail | null> {
  const supabase = getSupabaseAdmin();

  // 1. Ambil data aduan tanpa field reporter_whatsapp
  const { data: complaint, error: compErr } = await supabase
    .from('complaint')
    .select('id, ticket_number, description, category, ai_summary, status, created_at')
    .eq('id', id)
    .maybeSingle();

  if (compErr || !complaint) {
    return null;
  }

  // 2. Ambil riwayat pembaruan status & bukti dari tabel evidence (5 tabel Revisi 003)
  const { data: evidenceList, error: evErr } = await supabase
    .from('evidence')
    .select('id, status, note, storage_path, file_name, mime_type, size_bytes, created_at')
    .eq('complaint_id', id)
    .order('created_at', { ascending: true });

  const formattedUpdates = (evidenceList || []).map((e: any) => ({
    id: e.id,
    status: e.status as ComplaintStatus,
    note: e.note,
    rejectionReason: e.status === 'REJECTED' ? e.note : null,
    createdAt: e.created_at,
    evidence: [
      {
        id: e.id,
        fileName: e.file_name,
        mimeType: e.mime_type,
        sizeBytes: Number(e.size_bytes),
      },
    ],
  }));

  return {
    id: complaint.id,
    ticketNumber: complaint.ticket_number,
    description: complaint.description,
    category: complaint.category,
    aiSummary: complaint.ai_summary,
    status: complaint.status as ComplaintStatus,
    createdAt: complaint.created_at,
    updates: formattedUpdates,
  };
}

/**
 * 4. Mengubah status laporan dengan validasi bukti wajib & alasan penolakan
 * Mendukung idempotensi dan otomatis mencatat antrean notifikasi WhatsApp
 */
export async function updateComplaintStatus(
  input: UpdateComplaintInput
): Promise<UpdateComplaintResult> {
  const supabase = getSupabaseAdmin();

  // 1. Ambil status saat ini dari tabel complaint
  const { data: current, error: getErr } = await supabase
    .from('complaint')
    .select('id, status')
    .eq('id', input.complaintId)
    .maybeSingle();

  if (getErr || !current) {
    throw new Error('COMPLAINT_NOT_FOUND');
  }

  const currentStatus = current.status as ComplaintStatus;
  const targetStatus = input.targetStatus;

  // 2. Validasi Transisi Status Bisnis
  const allowed = ALLOWED_STATUS_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(targetStatus)) {
    throw new Error(
      `INVALID_STATUS_TRANSITION: Tidak dapat mengubah status dari '${currentStatus}' ke '${targetStatus}'`
    );
  }

  // 3. Validasi Bukti Wajib: Minimal 1 foto/dokumen bukti
  if (!input.files || input.files.length === 0) {
    throw new Error('EVIDENCE_REQUIRED: Perubahan status wajib menyertakan minimal satu file bukti');
  }

  // 4. Validasi Alasan Penolakan jika status REJECTED
  if (targetStatus === 'REJECTED') {
    if (!input.rejectionReason || !input.rejectionReason.trim()) {
      throw new Error('REJECTION_REASON_REQUIRED: Status penolakan (REJECTED) wajib menyertakan alasan penolakan');
    }
  }

  const fullNote = targetStatus === 'REJECTED'
    ? (input.rejectionReason ? `Alasan: ${input.rejectionReason.trim()}${input.note ? `. ${input.note.trim()}` : ''}` : input.note?.trim() || null)
    : input.note?.trim() || null;

  // Satu perubahan status memakai satu bukti. File diunggah sebelum data disimpan.
  if (input.files.length !== 1) {
    throw new Error('ONE_EVIDENCE_REQUIRED: Pilih tepat satu berkas bukti');
  }
  const file = input.files[0];
  const fileExt = file.fileName.split('.').pop() || 'bin';
  const storageKey = `${input.complaintId}/${crypto.randomUUID()}.${fileExt}`;
  const { error: uploadError } = await supabase.storage.from('evidence').upload(storageKey, file.buffer, {
    contentType: file.mimeType,
    upsert: false,
  });
  if (uploadError) throw new Error('UPLOAD_EVIDENCE_FAILED');

  const { data: evidence, error: evidenceError } = await supabase
    .from('evidence')
    .insert({
      complaint_id: input.complaintId,
      status: targetStatus,
      note: fullNote,
      storage_path: storageKey,
      file_name: file.fileName,
      mime_type: file.mimeType,
      size_bytes: file.sizeBytes,
      created_by: input.adminId || null,
    })
    .select('id, file_name, mime_type, created_at')
    .single();

  if (evidenceError || !evidence) {
    await supabase.storage.from('evidence').remove([storageKey]);
    throw new Error('SAVE_EVIDENCE_FAILED');
  }

  // Status harus benar-benar berubah sebelum pesan WhatsApp diantrikan.
  const { data: updated, error: updateError } = await supabase
    .from('complaint')
    .update({ status: targetStatus, updated_at: new Date().toISOString() })
    .eq('id', input.complaintId)
    .eq('status', currentStatus)
    .select('id')
    .maybeSingle();

  if (updateError || !updated) {
    await supabase.from('evidence').delete().eq('id', evidence.id);
    await supabase.storage.from('evidence').remove([storageKey]);
    throw new Error(updateError ? 'UPDATE_STATUS_FAILED' : 'INVALID_STATUS_TRANSITION');
  }

  let notificationStatus: 'QUEUED' | 'FAILED' = 'FAILED';
  try {
    const sent = await dispatchStatusNotification({
      complaintId: input.complaintId,
      status: targetStatus,
      note: fullNote,
    });
    notificationStatus = sent.success ? 'QUEUED' : 'FAILED';
  } catch {
    notificationStatus = 'FAILED';
  }

  return {
    id: evidence.id,
    complaintId: input.complaintId,
    status: targetStatus,
    note: fullNote,
    evidence: [{ id: evidence.id, fileName: evidence.file_name, mimeType: evidence.mime_type }],
    notificationStatus,
    createdAt: evidence.created_at,
  };
}
