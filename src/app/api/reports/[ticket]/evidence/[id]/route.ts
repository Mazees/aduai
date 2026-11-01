import { getSupabaseAdmin } from '@/lib/supabase/server';
import { ApiErrors } from '@/lib/api/response';

/** Nomor tiket memberi akses ke bukti; objek Storage tetap privat. */
export async function GET(_req: Request, { params }: { params: Promise<{ ticket: string; id: string }> }) {
  const { ticket, id } = await params;
  if (!ticket || !id) return ApiErrors.notFound('Bukti tidak ditemukan');

  const supabase = getSupabaseAdmin();
  const { data: complaint } = await supabase
    .from('complaint')
    .select('id')
    .eq('ticket_number', ticket.trim().toUpperCase())
    .maybeSingle();
  if (!complaint) return ApiErrors.notFound('Bukti tidak ditemukan');

  const { data: evidence } = await supabase
    .from('evidence')
    .select('storage_path')
    .eq('id', id)
    .eq('complaint_id', complaint.id)
    .maybeSingle();
  if (!evidence?.storage_path) return ApiErrors.notFound('Bukti tidak ditemukan');

  const { data: file, error } = await supabase.storage.from('evidence').download(evidence.storage_path);
  if (error || !file) return ApiErrors.notFound('Bukti tidak ditemukan');

  const mimeType = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'].includes(file.type)
    ? file.type : 'application/octet-stream';
  return new Response(await file.arrayBuffer(), {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': 'inline; filename="bukti"',
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'no-referrer',
    },
  });
}
