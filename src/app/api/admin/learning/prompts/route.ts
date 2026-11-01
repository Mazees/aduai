import { getActivePersonaPrompts } from '@/features/learning/server/service';
import { successResponse, ApiErrors } from '@/lib/api/response';

export async function GET() {
  try {
    const prompts = await getActivePersonaPrompts();
    return successResponse({
      count: prompts.length,
      prompts,
    });
  } catch (err) {
    console.error('[Admin Learning Prompts GET Error]', err);
    return ApiErrors.internal('Gagal membaca aturan persona AI');
  }
}
