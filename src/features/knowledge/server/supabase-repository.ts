import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import type { KnowledgeRepository, KnowledgeResult } from './search';

export class SupabaseKnowledgeRepository implements KnowledgeRepository {
  async match(
    vector: number[],
    options: { threshold: number; limit: number },
    signal?: AbortSignal
  ): Promise<KnowledgeResult[]> {
    if (signal?.aborted) throw signal.reason;

    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase.rpc('match_knowledge', {
        query_embedding: vector,
        match_threshold: options.threshold,
        match_count: options.limit,
      });

      if (error || !data) {
        console.warn('[KnowledgeSearch] RPC match_knowledge gagal atau belum ada data:', error?.message);
        return [];
      }

      return data.map((item: {
        id: string;
        title: string;
        content: string;
        source_url: string | null;
        similarity: number;
      }) => ({
        documentId: item.id,
        chunkId: item.id,
        title: item.title,
        excerpt: item.content,
        sourceUrl: item.source_url,
        score: item.similarity,
      }));
    } catch (err) {
      console.warn('[KnowledgeSearch] Error saat mencari vektor knowledge:', (err as Error).message);
      return [];
    }
  }
}
