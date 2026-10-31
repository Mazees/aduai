import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import type { PersonaRule } from '@/features/learning/server/repository';

/**
 * Mengambil persona prompt (aturan positif & negatif) aktif dari database
 * untuk diinjeksi ke dalam instruksi agen percakapan berikutnya
 */
export async function getActivePersonaPrompts(signal?: AbortSignal): Promise<PersonaRule[]> {
  if (signal?.aborted) throw signal.reason;

  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('persona_prompts')
      .select('type, content')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error || !data) return [];

    return data.map((row) => ({
      type: row.type as 'POSITIVE' | 'NEGATIVE',
      content: row.content,
    }));
  } catch {
    return [];
  }
}

/**
 * Menjadwalkan evaluasi aduan setelah konfirmasi berhasil
 * Service deduplikasi berdasarkan complaintId
 */
export async function enqueueEvaluationJob(job: {
  complaintId: string;
  conversation: unknown[];
}): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();

    // Pastikan tidak ada duplikasi pekerjaan untuk complaintId yang sama
    const { data: existing } = await supabase
      .from('ai_evaluations')
      .select('id')
      .eq('complaint_id', job.complaintId)
      .maybeSingle();

    if (existing) {
      return;
    }

    await supabase.from('ai_evaluations').insert({
      complaint_id: job.complaintId,
      summary: 'Menunggu evaluasi agent',
      has_new_learning: false,
      status: 'PENDING',
    });
  } catch (err) {
    console.error('[EvaluationQueue] Gagal menjadwalkan evaluasi:', (err as Error).message);
  }
}
