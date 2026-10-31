import { successResponse } from '@/lib/api/response';
import { clearAdminSessionCookie } from '@/lib/auth/admin-guard';

export async function POST() {
  const response = successResponse({
    message: 'Berhasil logout',
  });

  clearAdminSessionCookie(response);

  return response;
}
