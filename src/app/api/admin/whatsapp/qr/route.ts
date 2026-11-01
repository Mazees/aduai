import { requireAdminAuth } from '@/lib/auth/admin-guard';
import { errorResponse, successResponse } from '@/lib/api/response';
import { getWhatsAppQr } from '@/features/notifications/server/provider';

export async function POST(req: Request) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) return auth.response;

  const origin = req.headers.get('origin');
  if (origin && origin !== new URL(req.url).origin) {
    return errorResponse('FORBIDDEN', 'Asal permintaan tidak diizinkan.', 403);
  }

  const result = await getWhatsAppQr();
  if (!result.success || !result.imageDataUrl) {
    const code = result.error ?? 'GATEWAY_UNAVAILABLE';
    return errorResponse(code, code === 'ALREADY_CONNECTED'
      ? 'Perangkat sudah terhubung.'
      : 'QR WhatsApp belum dapat ditampilkan.', code === 'ALREADY_CONNECTED' ? 409 : 503);
  }

  return successResponse({ imageDataUrl: result.imageDataUrl }, 200, { 'Cache-Control': 'no-store' });
}
