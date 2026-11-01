import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import type { ProviderConfig } from '@/features/chat/server/provider';

/**
 * Membaca konfigurasi AI Provider dari database (tabel configuration singleton 'default')
 * Fallback ke environment variable jika belum dikonfigurasi di dashboard admin
 */
export async function readProviderConfig(): Promise<ProviderConfig> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('configuration')
      .select('ai_endpoint, ai_model, ai_api_key_ciphertext')
      .eq('id', 'default')
      .maybeSingle();

    if (!error && data && data.ai_endpoint && data.ai_model && data.ai_api_key_ciphertext) {
      return {
        endpoint: data.ai_endpoint,
        model: data.ai_model,
        apiKey: data.ai_api_key_ciphertext,
      };
    }
  } catch (err) {
    console.warn('[ProviderConfig] Tidak dapat membaca dari DB, menggunakan fallback env:', (err as Error).message);
  }

  // Fallback ke Environment Variables
  return {
    endpoint: process.env.AI_PROVIDER_ENDPOINT || 'https://api.groq.com/openai/v1/chat/completions',
    model: process.env.AI_PROVIDER_MODEL || 'llama-3.3-70b-versatile',
    apiKey: process.env.AI_PROVIDER_API_KEY || '',
  };
}

/**
 * Membaca Main Knowledge (pengetahuan resmi wilayah/organisasi) untuk diinjeksi ke AI
 */
export async function getMainKnowledge(signal?: AbortSignal): Promise<string> {
  if (signal?.aborted) throw signal.reason;

  try {
    const supabase = getSupabaseAdmin();
    const { data } = await supabase
      .from('configuration')
      .select('main_knowledge')
      .eq('id', 'default')
      .maybeSingle();

    return data?.main_knowledge || '';
  } catch {
    return '';
  }
}

/**
 * Menyimpan atau memperbarui konfigurasi AI Provider ke tabel configuration
 */
export async function saveProviderConfig(config: {
  endpoint: string;
  model: string;
  apiKey: string;
  adminId?: string | null;
}): Promise<void> {
  const supabase = getSupabaseAdmin();

  await supabase
    .from('configuration')
    .upsert({
      id: 'default',
      ai_endpoint: config.endpoint,
      ai_model: config.model,
      ai_api_key_ciphertext: config.apiKey,
      updated_by: config.adminId || null,
      updated_at: new Date().toISOString(),
    });
}
