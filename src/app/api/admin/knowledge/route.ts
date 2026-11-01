import { requireAdminAuth } from '@/lib/auth/admin-guard';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { ApiErrors, successResponse } from '@/lib/api/response';
import { knowledgeSchema, saveKnowledge } from '@/features/knowledge/server/admin';

export async function GET(req: Request) {
  const auth = await requireAdminAuth(req); if (!auth.authorized) return auth.response;
  const { data, error } = await getSupabaseAdmin().from('knowledge').select('id, title, content, status, source_url, updated_at').order('updated_at', { ascending: false }).limit(100);
  if (error) return ApiErrors.internal('Gagal memuat pengetahuan');
  return successResponse(data);
}
export async function POST(req: Request) {
  const auth = await requireAdminAuth(req); if (!auth.authorized) return auth.response;
  const parsed = knowledgeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return ApiErrors.badRequest('Periksa judul dan isi pengetahuan (maksimal 1.500 kata).');
  try { return successResponse(await saveKnowledge(parsed.data), 201); }
  catch { return ApiErrors.internal('Gagal menyimpan pengetahuan atau membuat embedding'); }
}
