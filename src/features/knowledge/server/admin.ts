import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { generateDocumentEmbedding } from '@/features/knowledge/server/embedding';

export const knowledgeSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(20000).refine((value) => value.split(/\s+/).length <= 1500),
  status: z.enum(['draft', 'published']).default('published'),
  sourceUrl: z.string().trim().url().max(2048).nullable().optional(),
});
export type KnowledgeInput = z.infer<typeof knowledgeSchema>;

export async function saveKnowledge(input: KnowledgeInput, id?: string) {
  const embedding = await generateDocumentEmbedding(input.content);
  const row = { title: input.title, content: input.content, status: input.status, source_url: input.sourceUrl || null, embedding, updated_at: new Date().toISOString() };
  const db = getSupabaseAdmin();
  const query = id ? db.from('knowledge').update(row).eq('id', id) : db.from('knowledge').insert(row);
  const { data, error } = await query.select('id, title, content, status, source_url, updated_at').maybeSingle();
  if (error) throw new Error('KNOWLEDGE_SAVE_FAILED');
  return data;
}
