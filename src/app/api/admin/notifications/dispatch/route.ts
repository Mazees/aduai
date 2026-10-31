import { requireAdminAuth } from '@/lib/auth/admin-guard';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { dispatchStatusNotification } from '@/features/notifications/server/service';
import { successResponse, ApiErrors } from '@/lib/api/response';
import type { ComplaintStatus } from '@/types/complaint';

export async function POST(req: Request) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json().catch(() => null);
    const complaintId = body?.complaintId;

    if (!complaintId || typeof complaintId !== 'string') {
      return ApiErrors.badRequest('complaintId wajib diisi');
    }

    const supabase = getSupabaseAdmin();
    const { data: comp, error: compErr } = await supabase
      .from('complaint')
      .select('id, status')
      .eq('id', complaintId)
      .maybeSingle();

    if (compErr || !comp) {
      return ApiErrors.notFound('Aduan tidak ditemukan');
    }

    const targetStatus = (body?.status as ComplaintStatus) || (comp.status as ComplaintStatus);
    const note = typeof body?.note === 'string' ? body.note : null;

    const result = await dispatchStatusNotification({
      complaintId: comp.id,
      status: targetStatus,
      note,
    });

    if (!result.success) {
      return ApiErrors.internal(result.error || 'Gagal mengirimkan notifikasi WhatsApp');
    }

    return successResponse({
      message: 'Notifikasi WhatsApp berhasil dikirim',
      messageId: result.messageId,
      simulated: result.simulated ?? false,
    });
  } catch (err) {
    console.error('[Admin Notification Dispatch Error]', err);
    return ApiErrors.internal('Gagal memproses dispatch notifikasi');
  }
}
