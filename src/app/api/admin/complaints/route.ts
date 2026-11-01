import { listComplaints } from '@/features/admin/server/complaints';
import { requireAdminAuth } from '@/lib/supabase/auth';
import { successResponse, ApiErrors } from '@/lib/api/response';
import type { ComplaintStatus } from '@/types/complaint';

export async function GET(req: Request) {
  try {
    const auth = await requireAdminAuth(req);
    if (auth.error) {
      return auth.error;
    }

    const { searchParams } = new URL(req.url);
    const status = (searchParams.get('status') as ComplaintStatus) || undefined;
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);

    const result = await listComplaints({ status, page, limit });
    return successResponse(result);
  } catch (err) {
    console.error('[Admin List Complaints Error]', err);
    return ApiErrors.internal('Gagal memuat daftar laporan');
  }
}
