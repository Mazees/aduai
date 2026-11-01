import { getActivePersonaPrompts } from '@/features/learning/server/service';
import { requireAdminAuth } from '@/lib/supabase/auth';
import { successResponse, ApiErrors } from '@/lib/api/response';

export async function GET(req: Request) {
  try {
    const auth = await requireAdminAuth(req);
    if (auth.error) {
      return auth.error;
    }

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
