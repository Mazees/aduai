import 'server-only';
import { type NextRequest, NextResponse } from 'next/server';
import { verifyAdminToken, type AdminSessionPayload } from '@/lib/security';
import { ApiErrors } from '@/lib/api/response';

export const ADMIN_COOKIE_NAME = 'aduai_admin_session';

/**
 * Membaca cookie sesi admin dari request header
 */
export function getAdminTokenFromRequest(req: Request | NextRequest): string | null {
  // 1. Coba dari Cookie header
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith(`${ADMIN_COOKIE_NAME}=`)) {
        return decodeURIComponent(cookie.substring(ADMIN_COOKIE_NAME.length + 1));
      }
    }
  }

  // 2. Coba dari Authorization header: Bearer <token>
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7).trim();
  }

  return null;
}

/**
 * Guard keamanan untuk route handler admin.
 * Memvalidasi token HMAC, masa aktif, dan mengembalikan data sesi admin.
 */
export async function requireAdminAuth(req: Request | NextRequest): Promise<
  | { authorized: true; session: AdminSessionPayload }
  | { authorized: false; response: NextResponse }
> {
  const token = getAdminTokenFromRequest(req);

  if (!token) {
    return {
      authorized: false,
      response: ApiErrors.unauthorized('Sesi admin tidak ditemukan. Silakan login kembali.'),
    };
  }

  const session = verifyAdminToken(token);
  if (!session) {
    return {
      authorized: false,
      response: ApiErrors.unauthorized('Token autentikasi tidak valid atau sudah kedaluwarsa.'),
    };
  }

  return {
    authorized: true,
    session,
  };
}

/**
 * Menyetel cookie sesi HttpOnly yang aman pada NextResponse
 */
export function setAdminSessionCookie(response: NextResponse, token: string, maxAge = 24 * 60 * 60): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    `${ADMIN_COOKIE_NAME}=${encodeURIComponent(token)}`,
    'Path=/',
    `Max-Age=${maxAge}`,
    'HttpOnly', // Mencegah akses dari JavaScript di browser (XSS protection)
    'SameSite=Lax', // Perlindungan CSRF
    ...(isProduction ? ['Secure'] : []), // Hanya kirim via HTTPS di production
  ].join('; ');

  response.headers.append('Set-Cookie', cookieOptions);
}

/**
 * Menghapus cookie sesi saat logout
 */
export function clearAdminSessionCookie(response: NextResponse): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const cookieOptions = [
    `${ADMIN_COOKIE_NAME}=`,
    'Path=/',
    'Max-Age=0',
    'HttpOnly',
    'SameSite=Lax',
    ...(isProduction ? ['Secure'] : []),
  ].join('; ');

  response.headers.append('Set-Cookie', cookieOptions);
}
