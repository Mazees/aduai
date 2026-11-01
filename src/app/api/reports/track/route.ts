import { z } from 'zod';
import { trackComplaint } from '@/features/complaints/server/service';
import { successResponse, ApiErrors } from '@/lib/api/response';
import { checkRateLimit } from '@/lib/security/rate-limit';

const TrackSchema = z.object({
  ticket: z.string().trim().min(5, 'Nomor tiket tidak valid').max(20, 'Nomor tiket terlalu panjang'),
  accessCode: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // 1. Anti Brute-Force Rate Limiting (Maks 10 percobaan per menit per IP)
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               req.headers.get('x-real-ip') ||
               '127.0.0.1';
    
    const rateCheck = checkRateLimit(`track:${ip}`, 10, 60 * 1000);
    if (!rateCheck.allowed) {
      return ApiErrors.tooManyRequests(
        `Terlalu banyak percobaan pelacakan. Silakan tunggu ${Math.ceil(rateCheck.resetInMs / 1000)} detik.`
      );
    }

    // 2. Validasi Input Payload
    const body = await req.json().catch(() => null);
    const parsed = TrackSchema.safeParse(body);

    if (!parsed.success) {
      return ApiErrors.badRequest('Data pelacakan tidak valid', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { ticket, accessCode } = parsed.data;

    // 3. Eksekusi Pelacakan cukup dengan nomor tiket
    try {
      const result = await trackComplaint({ ticket, accessCode });
      return successResponse(result);
    } catch {
      return ApiErrors.notFound('Laporan tidak ditemukan dengan nomor tiket tersebut.');
    }
  } catch (err) {
    console.error('[Track Complaint Error]', err);
    return ApiErrors.internal('Gagal memproses pelacakan laporan');
  }
}
