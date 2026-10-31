import { requireAdminAuth } from '@/lib/auth/admin-guard';
import { getMainKnowledge } from '@/features/admin/server/settings';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { successResponse, ApiErrors } from '@/lib/api/response';

export async function GET(req: Request) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) {
      return auth.response;
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
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json().catch(() => null);
    const content = typeof body?.mainKnowledge === 'string' ? body.mainKnowledge.trim() : '';

    if (content.length > 3000) {
      return ApiErrors.badRequest('Panjang Main Knowledge maksimal 3000 karakter');
    }

    const supabase = getSupabaseAdmin();
    const { data: existing } = await supabase
      .from('ai_provider_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    if (existing) {
      await supabase
        .from('ai_provider_settings')
        .update({
          main_knowledge: content,
          updated_by: auth.session.sub,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id);
    } else {
      await supabase.from('ai_provider_settings').insert({
        endpoint: process.env.AI_PROVIDER_ENDPOINT || 'https://api.groq.com/openai/v1/chat/completions',
        model: process.env.AI_PROVIDER_MODEL || 'llama-3.3-70b-versatile',
        api_key_ciphertext: '',
        main_knowledge: content,
        updated_by: auth.session.sub,
      });
    }

    return successResponse({
      mainKnowledge: content,
      maxCharacters: 3000,
    });
  } catch (err) {
    console.error('[Admin Main Knowledge PUT Error]', err);
    return ApiErrors.internal('Gagal memperbarui Main Knowledge');
  }
}
