import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { decryptSecret, encryptSecret } from '@/lib/security';
import type { ProviderConfig } from '@/features/chat/server/provider';

/**
 * Membaca konfigurasi AI Provider dari database
 * Fallback ke environment variable jika belum dikonfigurasi di dashboard admin
 */
export async function readProviderConfig(): Promise<ProviderConfig> {
  try {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
      .from('ai_provider_settings')
      .select('endpoint, model, api_key_ciphertext')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data && data.endpoint && data.model && data.api_key_ciphertext) {
      const apiKey = decryptSecret(data.api_key_ciphertext);
      return {
        endpoint: data.endpoint,
        model: data.model,
        apiKey,
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
      .from('ai_provider_settings')
      .select('main_knowledge')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    return data?.main_knowledge || '';
  } catch {
    return '';
  }
}

/**
 * Menyimpan atau memperbarui konfigurasi AI Provider
 */
export async function saveProviderConfig(config: {
  endpoint: string;
  model: string;
  apiKey: string;
  adminId: string;
}): Promise<void> {
  const supabase = getSupabaseAdmin();
  const ciphertext = encryptSecret(config.apiKey);

  const { data: existing } = await supabase
    .from('ai_provider_settings')
    .select('id')
    .limit(1)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('ai_provider_settings')
      .update({
        endpoint: config.endpoint,
        model: config.model,
        api_key_ciphertext: ciphertext,
        updated_by: config.adminId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('ai_provider_settings').insert({
      endpoint: config.endpoint,
      model: config.model,
      api_key_ciphertext: ciphertext,
      updated_by: config.adminId,
    });
  }
}
