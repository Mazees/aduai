import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import type { Evaluation, LearningRepository, PersonaRule } from './repository';

export class SupabaseLearningRepository implements LearningRepository {
  /**
   * Mengambil rangkuman evaluasi lampau dan aturan persona aktif
   * agar agen evaluasi tidak mengulang pelajaran yang sama
   */
  async context(signal?: AbortSignal): Promise<{ evaluations: string[]; prompts: PersonaRule[] }> {
    if (signal?.aborted) throw signal.reason;

    const supabase = getSupabaseAdmin();

    // 1. Ambil evaluasi sukses terdahulu
    const { data: evals, error: evalErr } = await supabase
      .from('ai_evaluation')
      .select('summary, positive_prompts, negative_prompts')
      .eq('status', 'SUCCESS')
      .order('created_at', { ascending: false })
      .limit(10);

    if (evalErr || !evals) {
      return { evaluations: [], prompts: [] };
    }

    const evaluations: string[] = [];
    const prompts: PersonaRule[] = [];

    for (const row of evals) {
      if (row.summary && typeof row.summary === 'string' && row.summary.trim()) {
        evaluations.push(row.summary.trim());
      }

      if (Array.isArray(row.positive_prompts)) {
        for (const p of row.positive_prompts) {
          if (typeof p === 'string' && p.trim()) {
            prompts.push({ type: 'POSITIVE', content: p.trim() });
          }
        }
      }

      if (Array.isArray(row.negative_prompts)) {
        for (const n of row.negative_prompts) {
          if (typeof n === 'string' && n.trim()) {
            prompts.push({ type: 'NEGATIVE', content: n.trim() });
          }
        }
      }
    }

    return { evaluations, prompts };
  }

  /**
   * Mengklaim job evaluasi untuk complaintId tertentu
   * Mencegah pemrosesan ganda / race condition
   */
  async claim(complaintId: string, token: string, signal?: AbortSignal): Promise<boolean> {
    if (signal?.aborted) throw signal.reason;

    const supabase = getSupabaseAdmin();

    const { data: existing, error: getErr } = await supabase
      .from('ai_evaluation')
      .select('id, status')
      .eq('complaint_id', complaintId)
      .maybeSingle();

    if (getErr) {
      console.warn('[LearningRepo] Gagal memeriksa status evaluasi:', getErr.message);
      return false;
    }

    // Jika sudah pernah sukses dievaluasi, lewati agar tidak membuang kuota LLM
    if (existing?.status === 'SUCCESS' || existing?.status === 'IN_PROGRESS') {
      return false;
    }

    if (existing) {
      // Klaim pekerjaan yang masih PENDING atau FAILED
      const { data: claimed, error: updateErr } = await supabase
        .from('ai_evaluation')
        .update({
          status: 'IN_PROGRESS',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .eq('status', existing.status)
        .select('id')
        .maybeSingle();

      return !updateErr && Boolean(claimed);
    }

    // Buat entri baru langsung berstatus IN_PROGRESS
    const { error: insertErr } = await supabase.from('ai_evaluation').insert({
      complaint_id: complaintId,
      status: 'IN_PROGRESS',
      summary: 'Sedang mengevaluasi percakapan...',
      has_new_learning: false,
      positive_prompts: [],
      negative_prompts: [],
    });

    return !insertErr;
  }

  /**
   * Menyimpan hasil evaluasi dan daftar persona baru ke database
   */
  async commit(
    complaintId: string,
    token: string,
    result: Evaluation,
    signal?: AbortSignal
  ): Promise<void> {
    if (signal?.aborted) throw signal.reason;

    const supabase = getSupabaseAdmin();

    const hasNewLearning =
      (result.positivePrompts && result.positivePrompts.length > 0) ||
      (result.negativePrompts && result.negativePrompts.length > 0);

    const { error } = await supabase
      .from('ai_evaluation')
      .update({
        status: 'SUCCESS',
        summary: result.evaluation,
        has_new_learning: Boolean(hasNewLearning),
        positive_prompts: result.positivePrompts || [],
        negative_prompts: result.negativePrompts || [],
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq('complaint_id', complaintId);

    if (error) {
      console.error('[LearningRepo] Gagal menyimpan komit evaluasi:', error.message);
      throw new Error(`COMMIT_EVALUATION_FAILED: ${error.message}`);
    }

    console.log(
      `[LearningRepo] Evaluasi tersimpan untuk aduan ${complaintId}: ${
        hasNewLearning ? 'Ditemukan pelajaran baru' : 'Tidak ada pelajaran baru'
      }`
    );
  }

  /**
   * Menandai kegagalan pemrosesan evaluasi agar bisa diaudit
   */
  async fail(complaintId: string, token: string, code = 'EVALUATION_FAILED'): Promise<void> {
    try {
      const supabase = getSupabaseAdmin();
      await supabase
        .from('ai_evaluation')
        .update({
          status: 'FAILED',
          summary: 'Proses pembelajaran gagal.',
          error_message: code,
          updated_at: new Date().toISOString(),
        })
        .eq('complaint_id', complaintId);
    } catch (err) {
      console.error('[LearningRepo] Gagal mencatat kegagalan evaluasi:', err);
    }
  }
}
