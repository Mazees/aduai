import { updateComplaintStatus } from '@/features/admin/server/complaints';
import { requireAdminAuth } from '@/lib/supabase/auth';
import { successResponse, ApiErrors } from '@/lib/api/response';
import type { ComplaintStatus } from '@/types/complaint';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth(req);
    if (auth.error) {
      return auth.error;
    }

    const { id: complaintId } = await params;
    if (!complaintId) {
      return ApiErrors.badRequest('ID laporan tidak valid');
    }

    const contentType = req.headers.get('content-type') || '';
    let targetStatus: ComplaintStatus;
    let note: string | undefined;
    let rejectionReason: string | undefined;
    const filesData: { buffer: Buffer; fileName: string; mimeType: string; sizeBytes: number }[] = [];

    const idempotencyKey =
      req.headers.get('idempotency-key') ||
      req.headers.get('Idempotency-Key') ||
      undefined;

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      targetStatus = formData.get('status') as ComplaintStatus;
      note = (formData.get('note') as string) || undefined;
      rejectionReason = (formData.get('rejectionReason') as string) || undefined;

      const rawFiles = formData.getAll('files');
      for (const item of rawFiles) {
        if (item instanceof File && item.size > 0) {
          const arrayBuffer = await item.arrayBuffer();
          filesData.push({
            buffer: Buffer.from(arrayBuffer),
            fileName: item.name,
            mimeType: item.type || 'application/octet-stream',
            sizeBytes: item.size,
          });
        }
      }
    } else {
      // JSON body fallback
      const body = await req.json().catch(() => ({}));
      targetStatus = body.status;
      note = body.note;
      rejectionReason = body.rejectionReason;

      if (Array.isArray(body.files)) {
        for (const f of body.files) {
          if (f.base64 && f.fileName) {
            const buf = Buffer.from(f.base64, 'base64');
            filesData.push({
              buffer: buf,
              fileName: f.fileName,
              mimeType: f.mimeType || 'application/octet-stream',
              sizeBytes: buf.length,
            });
          }
        }
      }
    }

    if (!targetStatus) {
      return ApiErrors.badRequest('Status tujuan wajib diisi');
    }

    try {
      const result = await updateComplaintStatus({
        complaintId,
        adminId: auth.user.id,
        targetStatus,
        note,
        rejectionReason,
        files: filesData,
        idempotencyKey,
      });

      return successResponse(result, 201);
    } catch (bizErr: unknown) {
      const msg = bizErr instanceof Error ? bizErr.message : String(bizErr || '');
      if (
        msg.includes('INVALID_STATUS_TRANSITION') ||
        msg.includes('EVIDENCE_REQUIRED') ||
        msg.includes('REJECTION_REASON_REQUIRED')
      ) {
        return ApiErrors.unprocessable(msg);
      }
      if (msg.includes('COMPLAINT_NOT_FOUND')) {
        return ApiErrors.notFound('Laporan tidak ditemukan');
      }
      if (msg.includes('IDEMPOTENCY_CONFLICT')) {
        return ApiErrors.idempotencyConflict();
      }
      throw bizErr;
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Kesalahan server';
    console.error('[Admin Update Complaint Status Error]', err);
    return ApiErrors.internal('Gagal memperbarui status laporan: ' + errorMsg);
  }
}
