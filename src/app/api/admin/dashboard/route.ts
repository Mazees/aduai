import { requireAdminAuth } from '@/lib/auth/admin-guard';
import { getDashboardCounts } from '@/features/admin/server/complaints';
import { successResponse, ApiErrors } from '@/lib/api/response';

export async function GET(req: Request) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) return auth.response;
  try {
    const data = await getDashboardCounts();
    return successResponse(data);
  } catch (err) {
    console.error('[Admin Dashboard Error]', err);
    return ApiErrors.internal('Gagal memuat statistik dashboard');
  }
}
