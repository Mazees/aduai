import { requireAdminAuth } from '@/lib/auth/admin-guard';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { ApiErrors, successResponse } from '@/lib/api/response';
import { knowledgeSchema, saveKnowledge } from '@/features/knowledge/server/admin';

type Context = { params: Promise<{ id: string }> };
export async function PUT(req: Request, { params }: Context) {
  const auth = await requireAdminAuth(req); if (!auth.authorized) return auth.response;
  const parsed = knowledgeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return ApiErrors.badRequest('Periksa judul dan isi pengetahuan (maksimal 1.500 kata).');
  try { const { id } = await params; const row = await saveKnowledge(parsed.data, id); return row ? successResponse(row) : ApiErrors.notFound('Pengetahuan tidak ditemukan'); }
  catch { return ApiErrors.internal('Gagal menyimpan pengetahuan atau membuat embedding'); }
}
export async function DELETE(req: Request, { params }: Context) {
  const auth = await requireAdminAuth(req); if (!auth.authorized) return auth.response;
  const { id } = await params;
  const { data, error } = await getSupabaseAdmin().from('knowledge').delete().eq('id', id).select('id').maybeSingle();
  if (error) return ApiErrors.internal('Gagal menghapus pengetahuan');
  return data ? successResponse({ deleted: true }) : ApiErrors.notFound('Pengetahuan tidak ditemukan');
}
