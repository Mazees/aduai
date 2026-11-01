import { requireAdminAuth } from '@/lib/auth/admin-guard';
import { readProviderConfig, saveProviderConfig } from '@/features/admin/server/settings';
import { successResponse, ApiErrors } from '@/lib/api/response';

export async function GET(req: Request) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) return auth.response;
  try {
    const config = await readProviderConfig();

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
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) return auth.response;
  try {
    const body = await req.json().catch(() => null);
    if (typeof body?.endpoint !== 'string' || typeof body?.model !== 'string' || !body.endpoint.trim() || !body.model.trim()) {
      return ApiErrors.badRequest('Field endpoint, model, dan apiKey wajib diisi');
    }

    let endpoint: URL;
    try { endpoint = new URL(body.endpoint); if (endpoint.protocol !== 'https:') throw new Error(); } catch { return ApiErrors.badRequest('Endpoint harus berupa URL HTTPS'); }
    const previous = await readProviderConfig();
    const apiKey = typeof body.apiKey === 'string' && body.apiKey.trim() ? body.apiKey.trim() : previous.apiKey;
    if (!apiKey) return ApiErrors.badRequest('API key wajib diisi untuk konfigurasi pertama');
    await saveProviderConfig({
      endpoint: body.endpoint,
      model: body.model,
      apiKey,
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
