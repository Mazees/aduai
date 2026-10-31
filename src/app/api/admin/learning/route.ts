import { requireAdminAuth } from '@/lib/auth/admin-guard';
import { getEvaluationDashboardData } from '@/features/learning/server/service';
import { successResponse, ApiErrors } from '@/lib/api/response';

export async function GET(req: Request) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const data = await getEvaluationDashboardData();
    return successResponse(data);
  } catch (err) {
    console.error('[Admin Learning GET Error]', err);
    return ApiErrors.internal('Gagal membaca data evaluasi pembelajaran AI');
  }
}
