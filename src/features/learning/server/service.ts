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
      .eq('status', 'SUCCESS')
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
  analytics: Record<'week' | 'month' | 'year', { date: string; created: number; completed: number }[]>;
  recentEvaluations: {
    id: string;
    complaintId: string;
    status: string;
    summary: string | null;
    errorCode: string | null;
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
    .select('id, complaint_id, status, summary, has_new_learning, positive_prompts, negative_prompts, error_message, created_at, updated_at')
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

  for (const row of allEvals) {
    if (row.status === 'SUCCESS') counts.success += 1;
    else if (row.status === 'PENDING') counts.pending += 1;
    else if (row.status === 'IN_PROGRESS') counts.inProgress += 1;
    else if (row.status === 'FAILED') counts.failed += 1;
    if (row.has_new_learning) counts.withNewLearning += 1;
  }
  const now = new Date();
  const periods = (length: number, monthly: boolean) => Array.from({ length }, (_, index) => {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), monthly ? 1 : now.getUTCDate()));
    if (monthly) date.setUTCMonth(date.getUTCMonth() - (length - 1 - index));
    else date.setUTCDate(date.getUTCDate() - (length - 1 - index));
    return { date: date.toISOString().slice(0, monthly ? 7 : 10), created: 0, completed: 0 };
  });
  const analytics = { week: periods(7, false), month: periods(30, false), year: periods(12, true) };
  for (const row of allEvals) {
    if (row.status === 'FAILED') continue;
    for (const [period, days] of Object.entries(analytics)) {
      const length = period === 'year' ? 7 : 10;
      const created = days.find((day) => day.date === row.created_at?.slice(0, length));
      if (created) created.created += 1;
      const completed = days.find((day) => day.date === row.updated_at?.slice(0, length));
      if (completed && row.status === 'SUCCESS') completed.completed += 1;
    }
  }
  const activePrompts = await getActivePersonaPrompts();

  const recentEvaluations = allEvals.slice(0, 25).map((row: { id: string; complaint_id: string; status: string; summary: string | null; has_new_learning: boolean; positive_prompts: unknown; negative_prompts: unknown; error_message: string | null; created_at: string }) => {
    const pos = Array.isArray(row.positive_prompts) ? row.positive_prompts.filter((p): p is string => typeof p === 'string') : [];
    const neg = Array.isArray(row.negative_prompts) ? row.negative_prompts.filter((p): p is string => typeof p === 'string') : [];

    return {
      id: row.id,
      complaintId: row.complaint_id,
      status: row.status,
      summary: row.status === 'FAILED' ? 'Proses pembelajaran gagal.' : row.summary,
      errorCode: row.status === 'FAILED' && typeof row.error_message === 'string' && /^[A-Z_]{3,50}$/.test(row.error_message) ? row.error_message : null,
      hasNewLearning: Boolean(row.has_new_learning),
      positivePrompts: pos,
      negativePrompts: neg,
      createdAt: row.created_at,
    };
  });

  return {
    counts,
    analytics,
    recentEvaluations,
    activePrompts,
  };
}
