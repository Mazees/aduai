import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { ApiErrors } from '@/lib/api/response';

export async function requireAdminAuth(req: Request) {
  const header = req.headers.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7).trim() : null;
  if (!token) return { authorized: false as const, response: ApiErrors.unauthorized() };

  const { data, error } = await getSupabaseAdmin().auth.getUser(token);
  if (error || !data.user) {
    return { authorized: false as const, response: ApiErrors.unauthorized('Sesi admin tidak valid atau sudah berakhir.') };
  }
  return { authorized: true as const, user: data.user };
}
