import { requireAdminAuth } from '@/lib/auth/admin-guard';
import { getWhatsAppConfig } from '@/features/notifications/server/provider';
import { successResponse, ApiErrors } from '@/lib/api/response';

export async function GET(req: Request) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const config = getWhatsAppConfig();

    return successResponse({
      isMock: config.isMock,
      apiUrl: config.apiUrl,
      hasToken: Boolean(config.apiToken && !config.isMock),
      maskedToken: config.apiToken
        ? `${config.apiToken.slice(0, 4)}...${config.apiToken.slice(-4)}`
        : null,
    });
  } catch (err) {
    console.error('[Admin WhatsApp Status Error]', err);
    return ApiErrors.internal('Gagal memeriksa status WhatsApp Gateway');
  }
}
