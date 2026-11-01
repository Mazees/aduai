import { requireAdminAuth } from '@/lib/auth/admin-guard';
import { successResponse } from '@/lib/api/response';
import { getWhatsAppDeviceStatus } from '@/features/notifications/server/provider';

export async function GET(req: Request) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) return auth.response;

  const status = await getWhatsAppDeviceStatus();
  const device = status.device;
  return successResponse({
    configured: status.configured,
    connected: status.connected,
    device: device ? `${device.slice(0, 4)}••••${device.slice(-3)}` : null,
    quota: status.quota,
    error: status.error ?? null,
  }, 200, { 'Cache-Control': 'no-store' });
}
