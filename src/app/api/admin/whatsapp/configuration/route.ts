import { requireAdminAuth } from '@/lib/auth/admin-guard';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { ApiErrors, successResponse } from '@/lib/api/response';

export async function PUT(req: Request) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) return auth.response;
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === 'string' ? body.token.trim() : '';
  if (!token || token.length > 512 || /[\r\n]/.test(token)) return ApiErrors.badRequest('Token Fonnte tidak valid');
  try {
    const db = getSupabaseAdmin();
    const { data, error } = await db.from('configuration').update({ whatsapp_api_token: token })
      .eq('id', 'default').select('id').maybeSingle();
    if (error) throw error;
    if (!data) {
      const result = await db.from('configuration').insert({ id: 'default', whatsapp_api_token: token });
      if (result.error) throw result.error;
    }
    return successResponse({ configured: true }, 200, { 'Cache-Control': 'no-store' });
  } catch {
    return ApiErrors.internal('Gagal menyimpan token Fonnte');
  }
}
