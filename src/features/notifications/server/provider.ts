import 'server-only';
import crypto from 'node:crypto';
import type { WhatsAppProviderConfig, WhatsAppSendInput, WhatsAppSendResult } from './types';

/**
 * Menyembunyikan nomor WhatsApp di log (misal: +6281234567890 -> +62812****7890)
 */
function maskWhatsapp(phone: string): string {
  if (phone.length <= 6) return '****';
  return `${phone.slice(0, 5)}****${phone.slice(-3)}`;
}

/**
 * Membaca konfigurasi WhatsApp Provider
 */
export function getWhatsAppConfig(): WhatsAppProviderConfig {
  const apiUrl = (process.env.WHATSAPP_API_URL || '').trim();
  const apiToken = (process.env.WHATSAPP_API_TOKEN || '').trim();

  const isMock =
    !apiUrl ||
    !apiToken ||
    apiToken === 'mock' ||
    apiToken === 'demo' ||
    apiToken.includes('your-whatsapp-api-token');

  return {
    apiUrl: apiUrl || 'https://api.whatsapp.mock/v1/send',
    apiToken,
    isMock,
  };
}

/**
 * Mengirim pesan WhatsApp ke nomor tujuan
 * Mendukung mode Mock/Simulasi otomatis jika token belum disetel di .env.local
 */
export async function sendWhatsAppMessage(
  input: WhatsAppSendInput,
  signal?: AbortSignal
): Promise<WhatsAppSendResult> {
  const config = getWhatsAppConfig();
  const maskedTo = maskWhatsapp(input.to);

  // 1. Mode Simulasi / Mock untuk Local Dev & Demo Offline
  if (config.isMock) {
    const mockId = `mock-wa-${crypto.randomUUID()}`;
    console.log(`[WhatsApp Provider] [SIMULASI] Pesan ke ${maskedTo} berhasil disimulasikan (ID: ${mockId})`);
    return {
      success: true,
      messageId: mockId,
      simulated: true,
    };
  }

  // 2. Mode Live Gateway (Fonnte, Wablas, atau Generic REST Gateway)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000); // 10 detik batas waktu

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Authorization: config.apiToken.startsWith('Bearer ') ? config.apiToken : `Bearer ${config.apiToken}`,
    };

    // Payload fleksibel yang mendukung Fonnte, Wablas, & generic REST
    const payload = {
      target: input.to,
      phone: input.to,
      to: input.to,
      message: input.message,
      text: input.message,
    };

    const res = await fetch(config.apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: signal || controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Status: ' + res.status);
      console.warn(`[WhatsApp Provider] Gateway mengembalikan error HTTP ${res.status}: ${errText.slice(0, 100)}`);
      return {
        success: false,
        error: `HTTP_${res.status}`,
      };
    }

    const data = await res.json().catch(() => ({}));
    const messageId =
      data.id || data.messageId || data.message_id || `wa-${crypto.randomUUID()}`;

    console.log(`[WhatsApp Provider] Pesan ke ${maskedTo} berhasil dikirim (ID: ${messageId})`);

    return {
      success: true,
      messageId: String(messageId),
      simulated: false,
    };
  } catch (err) {
    const msg = (err as Error).message || 'Koneksi gateway gagal';
    console.error(`[WhatsApp Provider] Gagal mengirim pesan ke ${maskedTo}:`, msg);
    return {
      success: false,
      error: msg,
    };
  }
}
