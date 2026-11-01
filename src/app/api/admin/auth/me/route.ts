import { requireAdminAuth } from '@/lib/supabase/auth';
import { successResponse } from '@/lib/api/response';

export async function GET(req: Request) {
  const auth = await requireAdminAuth(req);
  if (auth.error) {
    return auth.error;
  }

  return successResponse({
    admin: auth.user,
  });
}
