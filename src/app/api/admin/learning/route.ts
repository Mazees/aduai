import { getEvaluationDashboardData } from '@/features/learning/server/service';
import { successResponse, ApiErrors } from '@/lib/api/response';

export async function GET() {
  try {
    const data = await getEvaluationDashboardData();
    return successResponse(data);
  } catch (err) {
    console.error('[Admin Learning GET Error]', err);
    return ApiErrors.internal('Gagal membaca data evaluasi pembelajaran AI');
  }
}
