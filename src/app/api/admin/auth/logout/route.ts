import { successResponse } from '@/lib/api/response';
import { getSupabaseAdmin } from '@/lib/supabase/server';

export async function POST() {
  const supabase = getSupabaseAdmin();
  await supabase.auth.signOut().catch(() => {});
  return successResponse({
    message: 'Berhasil logout',
  });
}
