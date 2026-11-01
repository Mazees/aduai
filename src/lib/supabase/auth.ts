import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { ApiErrors } from '@/lib/api/response';
import type { NextResponse } from 'next/server';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
}

export type AuthResult =
  | { user: AdminUser; error: null }
  | { user: null; error: NextResponse };

/**
 * Ekstraksi token otentikasi dari Authorization Header atau Cookie
 */
export function extractAuthToken(req: Request): string | null {
  // 1. Prioritas utama: Header Authorization Bearer <token>
  const authHeader = req.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }

  // 2. Fallback: Cookie browser (sb-access-token atau sb-<project-ref>-auth-token)
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith('sb-access-token=')) {
        return decodeURIComponent(cookie.substring('sb-access-token='.length));
      }
      // Mendukung Supabase Auth cookie format
      if (cookie.includes('-auth-token=')) {
        try {
          const raw = decodeURIComponent(cookie.split('=')[1]);
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && typeof parsed[0] === 'string') {
            return parsed[0];
          }
          if (parsed && typeof parsed.access_token === 'string') {
            return parsed.access_token;
          }
        } catch {
          // Lewati jika bukan JSON
        }
      }
    }
  }

  return null;
}

/**
 * Kontrol Keamanan (Security Control) Inti untuk Admin AduAI:
 * Memverifikasi integritas dan keabsahan sesi langsung ke Supabase Auth (auth.users).
 * Bebas dari custom JWT secret atau password hashing manual karena admin dikelola langsung di Supabase.
 */
export async function requireAdminAuth(req: Request): Promise<AuthResult> {
  const token = extractAuthToken(req);

  if (!token) {
    return {
      user: null,
      error: ApiErrors.unauthorized('Sesi admin tidak ditemukan. Silakan masuk terlebih dahulu.'),
    };
  }

  try {
    const supabase = getSupabaseAdmin();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return {
        user: null,
        error: ApiErrors.unauthorized('Sesi admin tidak valid atau telah berakhir.'),
      };
    }

    const adminName =
      (user.user_metadata?.name as string) ||
      (user.user_metadata?.full_name as string) ||
      user.email?.split('@')[0] ||
      'Admin';

    return {
      user: {
        id: user.id,
        email: user.email || '',
        name: adminName,
      },
      error: null,
    };
  } catch (err) {
    console.error('[Admin Security Control Error]', err);
    return {
      user: null,
      error: ApiErrors.internal('Gagal memverifikasi kredensial keamanan.'),
    };
  }
}
