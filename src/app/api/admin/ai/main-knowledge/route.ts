import { getMainKnowledge } from '@/features/admin/server/settings';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { requireAdminAuth } from '@/lib/supabase/auth';
import { successResponse, ApiErrors } from '@/lib/api/response';

export async function GET(req: Request) {
  try {
    const auth = await requireAdminAuth(req);
    if (auth.error) {
      return auth.error;
    }

    const mainKnowledge = await getMainKnowledge();
    return successResponse({
      mainKnowledge,
      maxCharacters: 3000,
    });
  } catch (err) {
    console.error('[Admin Main Knowledge GET Error]', err);
    return ApiErrors.internal('Gagal membaca Main Knowledge');
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdminAuth(req);
    if (auth.error) {
      return auth.error;
    }

    const body = await req.json().catch(() => null);
    const content = typeof body?.mainKnowledge === 'string' ? body.mainKnowledge.trim() : '';

    if (content.length > 3000) {
      return ApiErrors.badRequest('Panjang Main Knowledge maksimal 3000 karakter');
    }

    const supabase = getSupabaseAdmin();
    await supabase
      .from('configuration')
      .upsert({
        id: 'default',
        main_knowledge: content,
        updated_by: auth.user.id,
        updated_at: new Date().toISOString(),
      });

    return successResponse({
      mainKnowledge: content,
      maxCharacters: 3000,
    });
  } catch (err) {
    console.error('[Admin Main Knowledge PUT Error]', err);
    return ApiErrors.internal('Gagal memperbarui Main Knowledge');
  }
}
