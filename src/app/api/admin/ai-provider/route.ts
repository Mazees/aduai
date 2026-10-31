import { requireAdminAuth } from '@/lib/auth/admin-guard';
import { readProviderConfig, saveProviderConfig } from '@/features/admin/server/settings';
import { successResponse, ApiErrors } from '@/lib/api/response';

export async function GET(req: Request) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const config = await readProviderConfig();

    // KEAMANAN: Jangan pernah membocorkan plain API key ke frontend admin
    return successResponse({
      configured: Boolean(config.apiKey),
      endpoint: config.endpoint,
      model: config.model,
    });
  } catch (err) {
    console.error('[Admin AI Provider GET Error]', err);
    return ApiErrors.internal('Gagal membaca konfigurasi AI provider');
  }
}

export async function PUT(req: Request) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json().catch(() => null);
    if (!body?.endpoint || !body?.model || !body?.apiKey) {
      return ApiErrors.badRequest('Field endpoint, model, dan apiKey wajib diisi');
    }

    await saveProviderConfig({
      endpoint: body.endpoint,
      model: body.model,
      apiKey: body.apiKey,
      adminId: auth.session.sub,
    });

    return successResponse({
      success: true,
      configured: true,
      endpoint: body.endpoint,
      model: body.model,
    });
  } catch (err) {
    console.error('[Admin AI Provider PUT Error]', err);
    return ApiErrors.internal('Gagal menyimpan konfigurasi AI provider');
  }
}
