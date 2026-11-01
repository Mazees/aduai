import 'server-only';
import type { AgentDependencies, ComplaintSubmittedHandler } from '@/features/chat/server/agent';
import { completeWithConfig, type Completion } from '@/features/chat/server/provider';
import { createKnowledgeSearch } from '@/features/knowledge/server/search';
import { SupabaseKnowledgeRepository } from '@/features/knowledge/server/supabase-repository';
import { submitComplaint, trackComplaint } from '@/features/complaints/server/service';
import { readProviderConfig, getMainKnowledge } from '@/features/admin/server/settings';
import { getActivePersonaPrompts, enqueueEvaluationJob } from '@/features/learning/server/service';

export interface AiServices {
  agent: AgentDependencies;
  onSubmitted: ComplaintSubmittedHandler;
}

const knowledgeRepository = new SupabaseKnowledgeRepository();
const knowledgeSearch = createKnowledgeSearch(knowledgeRepository);

/**
 * Titik sambung (Wiring Point) Dimas:
 * Membaca konfigurasi provider dan menghubungkan modul AI Mada ke database Supabase.
 */
export async function getAiServices(): Promise<AiServices> {
  const config = await readProviderConfig();

  const complete: Completion = (messages, tools, signal, onText) =>
    completeWithConfig(config, messages, tools, signal, onText);

  return {
    agent: {
      complete,
      submit: (draft, context, signal) => submitComplaint(draft, context, signal),
      mainKnowledge: (signal) => getMainKnowledge(signal),
      persona: (signal) => getActivePersonaPrompts(signal),
      search: knowledgeSearch,
      track: (input, signal) => trackComplaint(input, signal),
    },
    async onSubmitted(receipt, conversation) {
      await enqueueEvaluationJob({
        complaintId: receipt.complaintId,
        conversation,
      });
    },
  };
}
