import { getSupabaseAdmin } from '@/lib/supabase/server';
import { requireAdminAuth } from '@/lib/supabase/auth';
import { successResponse, ApiErrors } from '@/lib/api/response';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth(req);
    if (auth.error) {
      return auth.error;
    }

    const { id } = await params;
    if (!id) {
      return ApiErrors.badRequest('ID bukti tidak valid');
    }

    const supabase = getSupabaseAdmin();
    const { data: evidence, error: evErr } = await supabase
      .from('evidence')
      .select('id, storage_path, file_name, mime_type, size_bytes')
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
      fileName: evidence.file_name,
      mimeType: evidence.mime_type,
      sizeBytes: Number(evidence.size_bytes),
      signedUrl: signedData.signedUrl,
    });
  } catch (err) {
    console.error('[Admin Evidence Error]', err);
    return ApiErrors.internal('Gagal memproses berkas bukti');
  }
}
