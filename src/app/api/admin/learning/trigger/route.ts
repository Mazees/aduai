import { getSupabaseAdmin } from '@/lib/supabase/server';
import { requireAdminAuth } from '@/lib/supabase/auth';
import { runEvaluationJob } from '@/features/learning/server/runner';
import { successResponse, ApiErrors } from '@/lib/api/response';

export async function POST(req: Request) {
  try {
    const auth = await requireAdminAuth(req);
    if (auth.error) {
      return auth.error;
    }

    const body = await req.json().catch(() => null);
    const complaintId = body?.complaintId;

    if (!complaintId || typeof complaintId !== 'string') {
      return ApiErrors.badRequest('complaintId wajib diisi');
    }

    const supabase = getSupabaseAdmin();
    const { data: comp, error: compErr } = await supabase
      .from('complaint')
      .select('id, description, ai_summary')
      .eq('id', complaintId)
      .maybeSingle();

    if (compErr || !comp) {
      return ApiErrors.notFound('Aduan tidak ditemukan');
    }

    // Buat percakapan jika percakapan client tidak disertakan
    const conversation =
      Array.isArray(body?.conversation) && body.conversation.length > 0
        ? body.conversation
        : [
            { role: 'user' as const, content: comp.description },
            {
              role: 'assistant' as const,
              content: `Terima kasih atas laporan Anda: ${comp.ai_summary}`,
            },
          ];

    const result = await runEvaluationJob({
      complaintId: comp.id,
      conversation,
    });

    if (result.status === 'FAILED') {
      return ApiErrors.internal(result.error || 'Evaluasi AI gagal diproses');
    }

    return successResponse({
      message: 'Evaluasi pembelajaran AI berhasil diproses',
      status: result.status,
    });
  } catch (err) {
    console.error('[Admin Learning Trigger Error]', err);
    return ApiErrors.internal('Gagal menjalankan pemicu evaluasi AI');
  }
}
