import "server-only";
import { redactContacts } from "@/lib/ai/privacy";

export interface KnowledgeResult { documentId: string; chunkId: string; title: string; excerpt: string; sourceUrl: string | null; score: number }
export interface KnowledgeRepository {
  // Backend hanya mengembalikan dokumen resmi yang dipublikasikan.
  match(vector: number[], options: { threshold: number; limit: number }, signal?: AbortSignal): Promise<KnowledgeResult[]>;
}
// Dimas menyediakan repository; modul AI hanya menyiapkan embedding dan hasil tool.
export function createKnowledgeSearch(repository: KnowledgeRepository) {
  return async (query: string, limit = 3, signal?: AbortSignal): Promise<KnowledgeResult[]> => {
    if (!query.trim() || query.length > 500) throw new Error("INVALID_QUERY");
    const { generateEmbedding } = await import("./embedding");
    const vector = await generateEmbedding(redactContacts(query));
    if (signal?.aborted) throw signal.reason;
    return repository.match(vector, { threshold: 0.35, limit: Math.max(1, Math.min(5, limit)) }, signal);
  };
}


