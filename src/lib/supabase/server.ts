import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient<any> | null = null;

export function getSupabaseAdmin(): SupabaseClient<any> {
  if (cachedClient) {
    return cachedClient;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error(
      'DATABASE_CONFIG_MISSING: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment variables.'
    );
  }

  cachedClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return cachedClient;
}

export const supabaseAdmin = {
  get client() {
    return getSupabaseAdmin();
  },
};
