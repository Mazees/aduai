import { requireAdminAuth } from '@/lib/auth/admin-guard';
import { getComplaintDetail } from '@/features/admin/server/complaints';
import { successResponse, ApiErrors } from '@/lib/api/response';

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdminAuth(req);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;
    if (!id) {
      return ApiErrors.badRequest('ID laporan tidak valid');
    }

    const complaint = await getComplaintDetail(id);
    if (!complaint) {
      return ApiErrors.notFound('Laporan tidak ditemukan');
    }

    return successResponse(complaint);
  } catch (err) {
    console.error('[Admin Complaint Detail Error]', err);
    return ApiErrors.internal('Gagal memuat detail laporan');
  }
}
