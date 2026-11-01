import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { ApiErrors, successResponse } from '@/lib/api/response';

const schema = z.object({ refresh_token: z.string().min(1) });

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return ApiErrors.badRequest('Refresh token diperlukan');
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return ApiErrors.internal('Supabase belum dikonfigurasi');
  const client = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data, error } = await client.auth.refreshSession({ refresh_token: parsed.data.refresh_token });
  if (error || !data.session) return ApiErrors.unauthorized('Sesi admin telah berakhir');
  return successResponse({ session: {
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
    expires_at: data.session.expires_at,
  } });
}
