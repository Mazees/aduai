import { getSupabaseAdmin } from '@/lib/supabase/server';
import { successResponse, ApiErrors } from '@/lib/api/response';

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;

  if (!token) {
    return ApiErrors.unauthorized('Sesi admin tidak ditemukan.');
  }

  const supabase = getSupabaseAdmin();
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return ApiErrors.unauthorized('Token tidak valid atau sudah kedaluwarsa.');
  }

  const adminName =
    (user.user_metadata?.name as string) ||
    (user.user_metadata?.full_name as string) ||
    user.email?.split('@')[0] ||
    'Admin';

  return successResponse({
    admin: {
      id: user.id,
      email: user.email,
      name: adminName,
    },
  });
}
