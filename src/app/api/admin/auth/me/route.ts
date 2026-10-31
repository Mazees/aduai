import { requireAdminAuth } from '@/lib/auth/admin-guard';
import { successResponse } from '@/lib/api/response';

export async function GET(req: Request) {
  const auth = await requireAdminAuth(req);
  if (!auth.authorized) {
    return auth.response;
  }

  return successResponse({
    admin: {
      id: auth.session.sub,
      email: auth.session.email,
      name: auth.session.name,
    },
  });
}
