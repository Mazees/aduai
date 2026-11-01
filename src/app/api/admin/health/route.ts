import { getSupabaseAdmin } from '@/lib/supabase/server';
import { requireAdminAuth } from '@/lib/supabase/auth';
import { readProviderConfig } from '@/features/admin/server/settings';
import { getWhatsAppConfig } from '@/features/notifications/server/provider';
import { successResponse, ApiErrors } from '@/lib/api/response';

export async function GET(req: Request) {
  try {
    const auth = await requireAdminAuth(req);
    if (auth.error) {
      return auth.error;
    }

    const supabase = getSupabaseAdmin();
    const timestamp = new Date().toISOString();

    // 1. Periksa Koneksi Database
    let databaseStatus = 'ONLINE';
    let databaseLatencyMs = 0;
    try {
      const start = Date.now();
      const { error } = await supabase.from('complaint').select('id').limit(1);
      databaseLatencyMs = Date.now() - start;
      if (error) databaseStatus = `DEGRADED: ${error.message}`;
    } catch (dbErr) {
      databaseStatus = `OFFLINE: ${(dbErr as Error).message}`;
    }

    // 2. Periksa AI Provider
    let aiProviderStatus = 'CONFIGURED';
    let aiModel = 'unknown';
    try {
      const aiConfig = await readProviderConfig();
      aiModel = aiConfig.model;
      if (!aiConfig.apiKey) {
        aiProviderStatus = 'MISSING_API_KEY';
      }
    } catch {
      aiProviderStatus = 'ERROR';
    }

    // 3. Periksa WhatsApp Gateway
    const waConfig = getWhatsAppConfig();
    const whatsappStatus = waConfig.isMock ? 'SIMULATION_MODE' : 'LIVE_GATEWAY';

    // 4. Periksa Storage Buckets
    let storageStatus = 'ACCESSIBLE';
    try {
      const { data: buckets, error: bErr } = await supabase.storage.listBuckets();
      if (bErr) {
        storageStatus = `WARNING: ${bErr.message}`;
      } else {
        const hasEvidence = buckets?.some((b) => b.name === 'evidence');
        if (!hasEvidence) {
          storageStatus = 'BUCKET_EVIDENCE_NOT_FOUND';
        }
      }
    } catch {
      storageStatus = 'ERROR';
    }

    return successResponse({
      service: 'AduAI Backend API',
      timestamp,
      status: 'HEALTHY',
      checks: {
        database: {
          status: databaseStatus,
          latencyMs: databaseLatencyMs,
        },
        aiProvider: {
          status: aiProviderStatus,
          model: aiModel,
        },
        whatsappGateway: {
          status: whatsappStatus,
          apiUrl: waConfig.apiUrl,
        },
        storage: {
          status: storageStatus,
        },
      },
    });
  } catch (err) {
    console.error('[Admin Health Error]', err);
    return ApiErrors.internal('Gagal memeriksa kesehatan sistem');
  }
}
