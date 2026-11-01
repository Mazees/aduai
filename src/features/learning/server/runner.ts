import 'server-only';
import type { ChatMessage } from '@/types/chat';
import { readProviderConfig } from '@/features/admin/server/settings';
import { completeWithConfig, type Completion } from '@/features/chat/server/provider';
import { evaluateSubmittedComplaint } from './evaluate';
import { SupabaseLearningRepository } from './supabase-repository';

export interface EvaluationJobInput {
  complaintId: string;
  conversation: ChatMessage[];
}

/**
 * Menjalankan evaluasi AI Mada secara mandiri
 * Mengambil pelajaran baru untuk memperbarui persona komunikasi AI
 */
export async function runEvaluationJob(
  input: EvaluationJobInput,
  signal?: AbortSignal
): Promise<{ status: 'SUCCESS' | 'SKIPPED' | 'FAILED'; error?: string }> {
  try {
    const config = await readProviderConfig();
    const complete: Completion = (messages, tools, sig, onText) =>
      completeWithConfig(config, messages, tools, sig, onText);

    const repository = new SupabaseLearningRepository();

    const result = await evaluateSubmittedComplaint(
      {
        complaintId: input.complaintId,
        conversation: input.conversation,
      },
      {
        repository,
        complete,
      }
    );

    if (result.status === 'SKIPPED') {
      return { status: 'SKIPPED' };
    }

    return { status: 'SUCCESS' };
  } catch (err) {
    const errMsg = (err as Error).message || 'Evaluasi AI gagal';
    console.error(`[EvaluationRunner] Evaluasi gagal untuk aduan ${input.complaintId}:`, errMsg);
    return { status: 'FAILED', error: errMsg };
  }
}
