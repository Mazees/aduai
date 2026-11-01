import { requireAdminAuth } from '@/lib/auth/admin-guard';
import { getMainKnowledge } from '@/features/admin/server/settings';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { successResponse, ApiErrors } from '@/lib/api/response';

export async function GET(req: Request) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) return auth.response;
  try {
    const mainKnowledge = await getMainKnowledge();
    return successResponse({
      mainKnowledge,
      maxCharacters: 3000,
    });
  } catch (err) {
    console.error('[Admin Main Knowledge GET Error]', err);
    return ApiErrors.internal('Gagal membaca Main Knowledge');
  }
}

export async function PUT(req: Request) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) return auth.response;
  try {
    const body = await req.json().catch(() => null);
    if (typeof body?.mainKnowledge !== 'string') return ApiErrors.badRequest('Main Knowledge harus berupa teks');
    const content = body.mainKnowledge.trim();

    if (content.length > 3000) {
      return ApiErrors.badRequest('Panjang Main Knowledge maksimal 3000 karakter');
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase.from('configuration').update({ main_knowledge: content, updated_at: new Date().toISOString() }).eq('id', 'default').select('id').maybeSingle();
    if (error) throw error;
    if (!data) { const created = await supabase.from('configuration').insert({ id: 'default', main_knowledge: content }); if (created.error) throw created.error; }

    return successResponse({
      mainKnowledge: content,
      maxCharacters: 3000,
    });
  } catch (err) {
    console.error('[Admin Main Knowledge PUT Error]', err);
    return ApiErrors.internal('Gagal memperbarui Main Knowledge');
  }
}
