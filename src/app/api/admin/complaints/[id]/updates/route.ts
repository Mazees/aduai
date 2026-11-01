import { requireAdminAuth } from '@/lib/auth/admin-guard';
import { updateComplaintStatus } from '@/features/admin/server/complaints';
import { successResponse, ApiErrors } from '@/lib/api/response';
import type { ComplaintStatus } from '@/types/complaint';

function detectMime(bytes: Buffer): string | null {
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return 'image/jpeg';
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'image/png';
  if (bytes.subarray(0, 4).toString() === '%PDF') return 'application/pdf';
  if (bytes.subarray(0, 4).toString() === 'RIFF' && bytes.subarray(8, 12).toString() === 'WEBP') return 'image/webp';
  return null;
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) return auth.response;

  try {
    const { id: complaintId } = await params;
    if (!complaintId) return ApiErrors.badRequest('ID laporan tidak valid');
    if (!req.headers.get('content-type')?.includes('multipart/form-data')) {
      return ApiErrors.badRequest('Gunakan multipart/form-data untuk mengunggah bukti');
    }

    const form = await req.formData();
    const targetStatus = form.get('status') as ComplaintStatus | null;
    const note = form.get('note');
    const rejectionReason = form.get('rejectionReason');
    const files = form.getAll('files').filter((item): item is File => item instanceof File && item.size > 0);
    if (!targetStatus || files.length !== 1) {
      return ApiErrors.badRequest('Status dan tepat satu berkas bukti wajib diisi');
    }
    const file = files[0];
    if (file.size > 4_000_000) return ApiErrors.badRequest('Ukuran bukti maksimal 4 MB');
    const buffer = Buffer.from(await file.arrayBuffer());
    const mimeType = detectMime(buffer);
    if (!mimeType) return ApiErrors.badRequest('Bukti harus berupa JPG, PNG, WebP, atau PDF');

    const result = await updateComplaintStatus({
      complaintId,
      adminId: auth.user.id,
      targetStatus,
      note: typeof note === 'string' ? note : undefined,
      rejectionReason: typeof rejectionReason === 'string' ? rejectionReason : undefined,
      files: [{ buffer, fileName: file.name.slice(0, 150), mimeType, sizeBytes: file.size }],
      idempotencyKey: req.headers.get('idempotency-key') ?? undefined,
      origin: new URL(req.url).origin,
    });
    return successResponse(result, 201);
  } catch (error) {
    const code = error instanceof Error ? error.message.split(':')[0] : 'UNKNOWN';
    if (code === 'COMPLAINT_NOT_FOUND') return ApiErrors.notFound('Laporan tidak ditemukan');
    if (['INVALID_STATUS_TRANSITION', 'EVIDENCE_REQUIRED', 'ONE_EVIDENCE_REQUIRED', 'REJECTION_REASON_REQUIRED'].includes(code)) {
      return ApiErrors.unprocessable('Perubahan status tidak memenuhi aturan aduan');
    }
    console.error('[Admin Update Complaint Status Error]', code);
    return ApiErrors.internal('Gagal memperbarui status laporan');
  }
}
