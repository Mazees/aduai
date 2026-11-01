import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/server';
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
    const supabase = getSupabaseAdmin();
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

    const response = successResponse({
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

    if (data.session?.access_token) {
      response.cookies.set('sb-access-token', data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: data.session.expires_in || 3600,
      });
    }

    return response;
  } catch (err) {
    console.error('[Auth Login Fatal]', err);
    return ApiErrors.internal('Gagal memproses autentikasi');
  }
}
