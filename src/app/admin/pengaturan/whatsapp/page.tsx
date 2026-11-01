"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle, RefreshCw } from "lucide-react";
import AdminLayout from "@/components/AdminLayout";
import { adminFetch } from "@/lib/auth/admin-session";

type DeviceStatus = {
  configured: boolean;
  connected: boolean;
  device: string | null;
  quota: string | number | null;
  error: string | null;
};

type ApiResult<T> = { data?: T; error?: { code: string; message: string } };

const ERROR_TEXT: Record<string, string> = {
  WA_NOT_CONFIGURED: "Token Fonnte belum disimpan.",
  INVALID_TOKEN: "Token Fonnte tidak valid. Periksa pengaturan server.",
  DEVICE_DISCONNECTED: "Perangkat belum terhubung. Pindai QR untuk menghubungkannya.",
  QUOTA_EXHAUSTED: "Kuota Fonnte sudah habis.",
  GATEWAY_UNAVAILABLE: "Fonnte belum dapat dihubungi. Coba lagi sebentar.",
  GATEWAY_REJECTED: "Fonnte belum dapat memproses permintaan ini.",
};

export default function AdminWhatsAppPage() {
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [token, setToken] = useState('');
  const [savingToken, setSavingToken] = useState(false);
  const [tokenMessage, setTokenMessage] = useState<string | null>(null);

  const saveToken = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingToken(true);
    setTokenMessage(null);
    try {
      const response = await adminFetch('/api/admin/whatsapp/configuration', {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error?.message || 'Gagal menyimpan token.');
      setToken('');
      setQr(null);
      setTokenMessage('Token tersimpan. Periksa sambungan perangkat.');
      await refreshStatus();
    } catch (cause) {
      setTokenMessage(cause instanceof Error ? cause.message : 'Gagal menyimpan token.');
    } finally { setSavingToken(false); }
  };

  const refreshStatus = useCallback(async () => {
    try {
      const response = await adminFetch("/api/admin/whatsapp/status", { cache: "no-store" });
      if (response.status === 401) { setUnauthorized(true); return; }
      const result: ApiResult<DeviceStatus> = await response.json();
      if (!response.ok || !result.data) throw new Error(result.error?.code ?? "GATEWAY_UNAVAILABLE");
      setStatus(result.data);
      if (result.data.connected) setQr(null);
      setError(null);
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "GATEWAY_UNAVAILABLE";
      setError(ERROR_TEXT[code] ?? "Status WhatsApp belum dapat diperiksa.");
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => { void Promise.resolve().then(refreshStatus); }, [refreshStatus]);
  useEffect(() => {
    if (!qr) return;
    const timer = window.setInterval(() => { void refreshStatus(); }, 5000);
    return () => window.clearInterval(timer);
  }, [qr, refreshStatus]);

  const requestQr = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await adminFetch("/api/admin/whatsapp/qr", { method: "POST" });
      if (response.status === 401) { setUnauthorized(true); return; }
      const result: ApiResult<{ imageDataUrl: string }> = await response.json();
      if (!response.ok || !result.data?.imageDataUrl) throw new Error(result.error?.code ?? "GATEWAY_UNAVAILABLE");
      setQr(result.data.imageDataUrl);
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : "GATEWAY_UNAVAILABLE";
      setError(ERROR_TEXT[code] ?? "QR belum dapat ditampilkan. Coba lagi.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AdminLayout>
      <div className="admin-page admin-page-narrow">
        <div className="admin-page-heading">
          <div>
            <h1>Sambungan WhatsApp</h1>
            <p>Hubungkan nomor pengirim untuk pembaruan status aduan.</p>
          </div>
        </div>

        <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--surface-soft)] text-primary"><MessageCircle size={22} /></span>
            <div>
              <h2 className="font-semibold text-slate-900">Perangkat pengirim</h2>
              <p className="text-sm text-slate-600">Pesan dikirim melalui Fonnte dari nomor yang Anda hubungkan.</p>
            </div>
          </div>

          {unauthorized ? (
            <p className="text-sm text-slate-700">Sesi admin berakhir. <Link href="/admin/login" className="font-semibold text-primary underline">Masuk kembali</Link> untuk mengatur WhatsApp.</p>
          ) : (
            <>
              <form onSubmit={saveToken} className="space-y-2 border-b border-slate-100 pb-5">
                <label htmlFor="fonnte-token" className="block text-sm font-semibold text-slate-700">Token perangkat Fonnte</label>
                <div className="flex flex-wrap gap-2">
                  <input id="fonnte-token" type="password" required autoComplete="off" value={token} onChange={(event) => setToken(event.target.value)} placeholder={status?.configured ? 'Masukkan token baru untuk mengganti' : 'Masukkan token perangkat'} className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-primary" />
                  <button type="submit" disabled={savingToken} className="admin-page-action disabled:opacity-50">{savingToken ? 'Menyimpan...' : 'Simpan token'}</button>
                </div>
                <p className="text-xs text-slate-500">Token yang tersimpan tidak ditampilkan kembali.</p>
                {tokenMessage && <p role="status" className="text-sm text-slate-700">{tokenMessage}</p>}
              </form>
              <div aria-live="polite" className="text-sm">
                {checking && !status ? <p className="text-slate-600">Memeriksa sambungan...</p> : null}
                {status ? (
                  <p className={status.connected ? "font-semibold text-primary" : "font-semibold text-slate-700"}>
                    {status.connected ? "Perangkat terhubung" : status.configured ? "Perangkat belum terhubung" : "Token belum dikonfigurasi"}
                    {status.connected && status.device ? ` · ${status.device}` : ""}
                  </p>
                ) : null}
                {status?.quota != null ? <p className="mt-1 text-slate-600">Sisa kuota: {status.quota}</p> : null}
              </div>

              {error ? <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p> : null}
              {status?.error && !error ? <p className="text-sm text-slate-600">{ERROR_TEXT[status.error] ?? "Periksa pengaturan Fonnte."}</p> : null}

              {qr ? (
                <div className="space-y-3">
                  <Image unoptimized src={qr} alt="Kode QR untuk menghubungkan WhatsApp" width={260} height={260} className="rounded-lg border border-slate-200" />
                  <p className="text-sm text-slate-600">Buka WhatsApp di ponsel, pilih Perangkat tertaut, lalu pindai kode ini. Status akan diperiksa otomatis.</p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                {!status?.connected && status?.configured ? <button type="button" disabled={busy} onClick={() => void requestQr()} className="admin-page-action disabled:opacity-50">{busy ? "Menyiapkan QR..." : qr ? "Perbarui QR" : "Tampilkan QR"}</button> : null}
                <button type="button" disabled={checking} onClick={() => { setChecking(true); void refreshStatus(); }} className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"><RefreshCw size={16} /> Periksa sambungan</button>
              </div>
            </>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
