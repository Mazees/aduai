import { z } from 'zod';
import { createClient } from '@supabase/supabase-js';
import { successResponse, ApiErrors } from '@/lib/api/response';

const LoginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = LoginSchema.safeParse(body);

    if (!parsed.success) {
      return ApiErrors.badRequest('Data login tidak valid', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { email, password } = parsed.data;

    // Autentikasi langsung menggunakan Supabase Auth (auth.users)
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) return ApiErrors.internal('Supabase belum dikonfigurasi');
    const supabase = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });

    if (error || !data?.user) {
      console.warn('[Supabase Auth Login Failed]:', error?.message);
      return ApiErrors.unauthorized('Email atau password tidak sesuai.');
    }

    const user = data.user;
    const adminName =
      (user.user_metadata?.name as string) ||
      (user.user_metadata?.full_name as string) ||
      user.email?.split('@')[0] ||
      'Admin';

    return successResponse({
      user: {
        id: user.id,
        email: user.email,
        name: adminName,
      },
      session: data.session
        ? {
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
            expires_at: data.session.expires_at,
          }
        : null,
    });
  } catch (err) {
    console.error('[Auth Login Fatal]', err);
    return ApiErrors.internal('Gagal memproses autentikasi');
  }
}
