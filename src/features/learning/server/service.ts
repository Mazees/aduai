import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import type { PersonaRule } from '@/features/learning/server/repository';
import type { ChatMessage } from '@/types/chat';
import { runEvaluationJob } from './runner';

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
      .select('id, status')
      .eq('complaint_id', job.complaintId)
      .maybeSingle();

    if (existing && (existing.status === 'SUCCESS' || existing.status === 'IN_PROGRESS')) {
      return;
    }

    if (!existing) {
      await supabase.from('ai_evaluation').insert({
        complaint_id: job.complaintId,
        summary: 'Menunggu evaluasi agent',
        has_new_learning: false,
        status: 'PENDING',
        positive_prompts: [],
        negative_prompts: [],
      });
    }

    // Jalankan runner evaluasi secara asinkron di latar belakang
    if (Array.isArray(job.conversation) && job.conversation.length > 0) {
      void runEvaluationJob({
        complaintId: job.complaintId,
        conversation: job.conversation as ChatMessage[],
      }).catch((err) => {
        console.warn('[EvaluationQueue] Background runner error:', (err as Error).message);
      });
    }
  } catch (err) {
    console.error('[EvaluationQueue] Gagal menjadwalkan evaluasi:', (err as Error).message);
  }
}

/**
 * Mengambil data ringkasan monitoring evaluasi AI untuk Dashboard Admin
 */
export async function getEvaluationDashboardData(): Promise<{
  counts: {
    total: number;
    success: number;
    pending: number;
    inProgress: number;
    failed: number;
    withNewLearning: number;
  };
  recentEvaluations: {
    id: string;
    complaintId: string;
    status: string;
    summary: string | null;
    hasNewLearning: boolean;
    positivePrompts: string[];
    negativePrompts: string[];
    createdAt: string;
  }[];
  activePrompts: PersonaRule[];
}> {
  const supabase = getSupabaseAdmin();

  // 1. Ambil seluruh data evaluasi
  const { data: allEvals, error } = await supabase
    .from('ai_evaluation')
    .select('id, complaint_id, status, summary, has_new_learning, positive_prompts, negative_prompts, created_at')
    .order('created_at', { ascending: false });

  if (error || !allEvals) {
    throw new Error(`DATABASE_ERROR: ${error?.message}`);
  }

  const counts = {
    total: allEvals.length,
    success: 0,
    pending: 0,
    inProgress: 0,
    failed: 0,
    withNewLearning: 0,
  };

  const activePrompts: PersonaRule[] = [];

  const recentEvaluations = allEvals.slice(0, 25).map((row: any) => {
    if (row.status === 'SUCCESS') counts.success += 1;
    else if (row.status === 'PENDING') counts.pending += 1;
    else if (row.status === 'IN_PROGRESS') counts.inProgress += 1;
    else if (row.status === 'FAILED') counts.failed += 1;

    if (row.has_new_learning) counts.withNewLearning += 1;

    const pos = Array.isArray(row.positive_prompts) ? row.positive_prompts : [];
    const neg = Array.isArray(row.negative_prompts) ? row.negative_prompts : [];

    // Jika evaluasi sukses dan memiliki aturan, sertakan ke activePrompts
    if (row.status === 'SUCCESS') {
      pos.forEach((p: string) => {
        if (typeof p === 'string' && p.trim()) {
          activePrompts.push({ type: 'POSITIVE', content: p.trim() });
        }
      });
      neg.forEach((n: string) => {
        if (typeof n === 'string' && n.trim()) {
          activePrompts.push({ type: 'NEGATIVE', content: n.trim() });
        }
      });
    }

    return {
      id: row.id,
      complaintId: row.complaint_id,
      status: row.status,
      summary: row.summary,
      hasNewLearning: Boolean(row.has_new_learning),
      positivePrompts: pos,
      negativePrompts: neg,
      createdAt: row.created_at,
    };
  });

  return {
    counts,
    recentEvaluations,
    activePrompts,
  };
}
