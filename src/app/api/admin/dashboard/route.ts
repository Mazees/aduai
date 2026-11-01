import { getDashboardCounts } from '@/features/admin/server/complaints';
import { requireAdminAuth } from '@/lib/supabase/auth';
import { successResponse, ApiErrors } from '@/lib/api/response';

export async function GET(req: Request) {
  try {
    const auth = await requireAdminAuth(req);
    if (auth.error) {
      return auth.error;
    }

    const data = await getDashboardCounts();
    return successResponse(data);
  } catch (err) {
    console.error('[Admin Dashboard Error]', err);
    return ApiErrors.internal('Gagal memuat statistik dashboard');
  }
}
