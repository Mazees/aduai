import { requireAdminAuth } from '@/lib/auth/admin-guard';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { successResponse, ApiErrors } from '@/lib/api/response';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) return auth.response;
  try {
    const { id } = await params;
    if (!id) {
      return ApiErrors.badRequest('ID bukti tidak valid');
    }

    const supabase = getSupabaseAdmin();
    const { data: evidence, error: evErr } = await supabase
      .from('evidence')
      .select('id, storage_path')
      .eq('id', id)
      .maybeSingle();

    if (evErr || !evidence) {
      return ApiErrors.notFound('File bukti tidak ditemukan');
    }

    // Buat Signed URL berumur pendek (10 menit) untuk akses aman privat
    const { data: signedData, error: signErr } = await supabase.storage
      .from('evidence')
      .createSignedUrl(evidence.storage_path, 60 * 10);

    if (signErr || !signedData?.signedUrl) {
      return ApiErrors.internal('Gagal membuat tautan unduhan bukti');
    }

    return successResponse({
      id: evidence.id,
      signedUrl: signedData.signedUrl,
    });
  } catch (err) {
    console.error('[Admin Evidence Error]', err);
    return ApiErrors.internal('Gagal memproses berkas bukti');
  }
}
