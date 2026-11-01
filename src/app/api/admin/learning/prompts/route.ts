import { requireAdminAuth } from '@/lib/auth/admin-guard';
import { getActivePersonaPrompts } from '@/features/learning/server/service';
import { successResponse, ApiErrors } from '@/lib/api/response';

export async function GET(req: Request) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) return auth.response;
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
