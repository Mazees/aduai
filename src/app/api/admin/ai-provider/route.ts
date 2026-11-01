import { readProviderConfig, saveProviderConfig } from '@/features/admin/server/settings';
import { successResponse, ApiErrors } from '@/lib/api/response';

export async function GET() {
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
  try {
    const body = await req.json().catch(() => null);
    if (!body?.endpoint || !body?.model || !body?.apiKey) {
      return ApiErrors.badRequest('Field endpoint, model, dan apiKey wajib diisi');
    }

    await saveProviderConfig({
      endpoint: body.endpoint,
      model: body.model,
      apiKey: body.apiKey,
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
