import 'server-only';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import type { WhatsAppSendInput, WhatsAppSendResult } from './types';

const FONNTE_BASE_URL = 'https://api.fonnte.com';

type FonnteResponse = {
  status?: boolean;
  reason?: string;
  id?: string[];
  requestid?: number;
  url?: string;
  device?: string;
  device_status?: string;
  quota?: string | number;
};

export type WhatsAppDeviceStatus = {
  configured: boolean;
  connected: boolean;
  device: string | null;
  quota: string | number | null;
  error?: string;
};

export type WhatsAppQrResult = {
  success: boolean;
  imageDataUrl?: string;
  error?: string;
};

async function getToken(): Promise<string | null> {
  const { data, error } = await getSupabaseAdmin().from('configuration')
    .select('whatsapp_api_token').eq('id', 'default').maybeSingle();
  if (error) throw new Error('WA_CONFIG_UNAVAILABLE');
  return typeof data?.whatsapp_api_token === 'string' ? data.whatsapp_api_token.trim() || null : null;
}

function providerError(response: FonnteResponse): string {
  const reason = response.reason?.toLowerCase() ?? '';
  if (reason.includes('token')) return 'INVALID_TOKEN';
  if (reason.includes('disconnect')) return 'DEVICE_DISCONNECTED';
  if (reason.includes('quota')) return 'QUOTA_EXHAUSTED';
  if (reason.includes('already connect')) return 'ALREADY_CONNECTED';
  return 'GATEWAY_REJECTED';
}

async function requestFonnte(path: '/send' | '/device' | '/qr', body: FormData): Promise<FonnteResponse> {
  const token = await getToken();
  if (!token) throw new Error('WA_NOT_CONFIGURED');

  const response = await fetch(`${FONNTE_BASE_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: token },
    body,
    cache: 'no-store',
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) throw new Error('GATEWAY_UNAVAILABLE');
  const data: unknown = await response.json().catch(() => null);
  if (!data || typeof data !== 'object') throw new Error('GATEWAY_INVALID_RESPONSE');
  return data as FonnteResponse;
}

/** Status ini berasal dari Fonnte, bukan dari proses WhatsApp dalam Vercel. */
export async function getWhatsAppDeviceStatus(): Promise<WhatsAppDeviceStatus> {
  try {
    if (!await getToken()) {
    return { configured: false, connected: false, device: null, quota: null, error: 'WA_NOT_CONFIGURED' };
    }
    const data = await requestFonnte('/device', new FormData());
    if (data.status !== true) {
      return { configured: true, connected: false, device: null, quota: null, error: providerError(data) };
    }
    return {
      configured: true,
      connected: data.device_status === 'connect',
      device: typeof data.device === 'string' ? data.device : null,
      quota: data.quota ?? null,
    };
  } catch (error) {
    return { configured: true, connected: false, device: null, quota: null, error: error instanceof Error ? error.message : 'GATEWAY_UNAVAILABLE' };
  }
}

export async function getWhatsAppQr(): Promise<WhatsAppQrResult> {
  try {
    if (!await getToken()) return { success: false, error: 'WA_NOT_CONFIGURED' };
    const body = new FormData();
    body.set('type', 'qr');
    const data = await requestFonnte('/qr', body);
    if (data.status !== true || typeof data.url !== 'string' || !/^[A-Za-z0-9+/=]+$/.test(data.url)) {
      return { success: false, error: providerError(data) };
    }
    return { success: true, imageDataUrl: `data:image/png;base64,${data.url}` };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'GATEWAY_UNAVAILABLE' };
  }
}

/** Fonnte menerima pesan ke antrean; hasil ini belum membuktikan pesan dibaca. */
export async function sendWhatsAppMessage(input: WhatsAppSendInput): Promise<WhatsAppSendResult> {
  if (!/^\+[1-9]\d{7,14}$/.test(input.to) || !input.message.trim()) {
    return { success: false, error: 'INVALID_MESSAGE' };
  }

  try {
    if (!await getToken()) return { success: false, error: 'WA_NOT_CONFIGURED' };
    const body = new FormData();
    body.set('target', input.to.slice(1));
    body.set('message', input.message);
    body.set('countryCode', '0');
    body.set('connectOnly', 'true');
    const data = await requestFonnte('/send', body);
    if (data.status !== true) return { success: false, error: providerError(data) };
    const id = Array.isArray(data.id) ? data.id[0] : undefined;
    return { success: true, messageId: id ?? (data.requestid ? String(data.requestid) : undefined) };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'GATEWAY_UNAVAILABLE' };
  }
}
