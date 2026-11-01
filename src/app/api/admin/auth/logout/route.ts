import { successResponse } from '@/lib/api/response';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST() {
  const supabase = getSupabaseAdmin();
  await supabase.auth.signOut().catch(() => {});
  const res = successResponse({
    message: 'Berhasil logout',
  });
  res.cookies.set('sb-access-token', '', {
    path: '/',
    maxAge: 0,
  });
  return res;
}
