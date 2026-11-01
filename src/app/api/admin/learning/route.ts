import { getEvaluationDashboardData } from '@/features/learning/server/service';
import { requireAdminAuth } from '@/lib/supabase/auth';
import { successResponse, ApiErrors } from '@/lib/api/response';

export async function GET(req: Request) {
  try {
    const auth = await requireAdminAuth(req);
    if (auth.error) {
      return auth.error;
    }

    const data = await getEvaluationDashboardData();
    return successResponse(data);
  } catch (err) {
    console.error('[Admin Learning GET Error]', err);
    return ApiErrors.internal('Gagal membaca data evaluasi pembelajaran AI');
  }
}
