import 'server-only';
import { NextResponse } from 'next/server';

export interface ApiSuccessResponse<T> {
  data: T;
}

export interface ApiErrorResponse {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * Format response sukses standar AduAI: { "data": ... }
 */
export function successResponse<T>(data: T, status = 200, headers: HeadersInit = {}): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json(
    { data },
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    }
  );
}

/**
 * Format response error standar AduAI: { "error": { "code": "...", "message": "..." } }
 * Memastikan tidak ada detail sensitif atau internal trace yang bocor.
 */
export function errorResponse(
  code: string,
  message: string,
  status = 400,
  details?: Record<string, unknown>
): NextResponse<ApiErrorResponse> {
  const body: ApiErrorResponse = {
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };

  return NextResponse.json(body, {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Error helper umum
 */
export const ApiErrors = {
  unauthorized: (msg = 'Autentikasi diperlukan atau sesi telah berakhir') =>
    errorResponse('UNAUTHORIZED', msg, 401),

  forbidden: (msg = 'Akses ditolak') =>
    errorResponse('FORBIDDEN', msg, 403),

  notFound: (msg = 'Data tidak ditemukan') =>
    errorResponse('NOT_FOUND', msg, 404),

  badRequest: (msg = 'Permintaan tidak valid', details?: Record<string, unknown>) =>
    errorResponse('BAD_REQUEST', msg, 400, details),

  idempotencyConflict: (msg = 'Permintaan dengan kunci idempotensi ini sedang diproses atau berbeda payload') =>
    errorResponse('IDEMPOTENCY_CONFLICT', msg, 409),

  unprocessable: (msg = 'Aturan bisnis atau validasi tidak terpenuhi', details?: Record<string, unknown>) =>
    errorResponse('UNPROCESSABLE_ENTITY', msg, 422),

  tooManyRequests: (msg = 'Terlalu banyak permintaan. Silakan tunggu beberapa saat.') =>
    errorResponse('RATE_LIMIT_EXCEEDED', msg, 429),

  internal: (msg = 'Terjadi kesalahan internal pada server') =>
    errorResponse('INTERNAL_SERVER_ERROR', msg, 500),
};
