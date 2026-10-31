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
      .from('ai_evaluation')
      .select('positive_prompts, negative_prompts')
      .eq('has_new_learning', true)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error || !data) return [];

    const rules: PersonaRule[] = [];
    for (const row of data) {
      if (Array.isArray(row.positive_prompts)) {
        for (const p of row.positive_prompts) {
          if (typeof p === 'string' && p.trim()) {
            rules.push({ type: 'POSITIVE', content: p.trim() });
          }
        }
      }
      if (Array.isArray(row.negative_prompts)) {
        for (const n of row.negative_prompts) {
          if (typeof n === 'string' && n.trim()) {
            rules.push({ type: 'NEGATIVE', content: n.trim() });
          }
        }
      }
    }
    return rules;
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
      .from('ai_evaluation')
      .select('id')
      .eq('complaint_id', job.complaintId)
      .maybeSingle();

    if (existing) {
      return;
    }

    await supabase.from('ai_evaluation').insert({
      complaint_id: job.complaintId,
      summary: 'Menunggu evaluasi agent',
      has_new_learning: false,
      status: 'PENDING',
      positive_prompts: [],
      negative_prompts: [],
    });
  } catch (err) {
    console.error('[EvaluationQueue] Gagal menjadwalkan evaluasi:', (err as Error).message);
  }
}
