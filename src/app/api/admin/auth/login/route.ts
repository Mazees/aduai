import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { createAdminToken } from '@/lib/security';
import { successResponse, ApiErrors } from '@/lib/api/response';
import { setAdminSessionCookie } from '@/lib/auth/admin-guard';

const LoginSchema = z.object({
  email: z.string().email('Format email tidak valid'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
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
      // Pesan generik untuk perlindungan keamanan
      return ApiErrors.unauthorized('Email atau password tidak sesuai.');
    }

    const user = data.user;
    const adminName =
      (user.user_metadata?.name as string) ||
      (user.user_metadata?.full_name as string) ||
      user.email?.split('@')[0] ||
      'Admin';

    // Buat token session admin
    const token = createAdminToken({
      id: user.id,
      email: user.email || email,
      name: adminName,
    });

    const response = successResponse({
      admin: {
        id: user.id,
        email: user.email,
        name: adminName,
      },
    });

    // Simpan token ke dalam Cookie HttpOnly & SameSite
    setAdminSessionCookie(response, token);

    return response;
  } catch (err) {
    console.error('[Auth Login Fatal]', err);
    return ApiErrors.internal('Gagal memproses autentikasi');
  }
}
