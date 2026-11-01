import { z } from 'zod';
import { trackComplaint } from '@/features/complaints/server/service';
import { successResponse, ApiErrors } from '@/lib/api/response';

const TrackSchema = z.object({
  ticket: z.string().trim().min(5, 'Nomor tiket tidak valid').max(20, 'Nomor tiket terlalu panjang'),
  accessCode: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const parsed = TrackSchema.safeParse(body);

    if (!parsed.success) {
      return ApiErrors.badRequest('Data pelacakan tidak valid', {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    const { ticket, accessCode } = parsed.data;

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
