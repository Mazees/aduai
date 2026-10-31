"use client";

import React, { useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { MockService, INITIAL_PROVIDER_CONFIG } from "@/lib/mock-service";
import { AiProviderConfig } from "@/types/complaint";
import {
  CheckCircle2,
  AlertCircle,
  KeyRound,
  Globe,
  Bot,
  Zap,
  Loader2,
} from "lucide-react";
import { useIsMounted } from "@/lib/use-is-mounted";

export default function AdminAiProviderSettingsPage() {
  const isMounted = useIsMounted();
  const [clientConfig, setClientConfig] = useState<AiProviderConfig | null>(null);
  const config = clientConfig ?? (isMounted ? MockService.getAiProviderConfig() : INITIAL_PROVIDER_CONFIG);

  const [endpoint, setEndpoint] = useState(() => INITIAL_PROVIDER_CONFIG.endpoint);
  const [model, setModel] = useState(() => INITIAL_PROVIDER_CONFIG.model);
  const [apiKey, setApiKey] = useState("");
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSaveSuccess(false);

    const updated = MockService.updateAiProviderConfig({
      endpoint,
      model,
      apiKey: apiKey.trim() || undefined,
    });
    setClientConfig(updated);
    setApiKey("");
    setIsEditingKey(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  };

  const handleTestConnection = () => {
    setIsTesting(true);
    setTestResult(null);

    setTimeout(() => {
      setIsTesting(false);
      if (endpoint && model) {
        setTestResult({
          success: true,
          message: `Koneksi berhasil ke endpoint ${endpoint}. Model '${model}' merespons dengan latency 142ms dan mendukung tool calling.`,
        });
      } else {
        setTestResult({
          success: false,
          message: "Endpoint URL dan Nama Model wajib diisi untuk pengujian.",
        });
      }
    }, 900);
  };

  if (!config) return null;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        {/* Header */}
        <div className="pb-2 border-b border-slate-200">
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Pengaturan Integrasi Provider AI
          </h1>
          <p className="text-xs text-slate-500">
            Konfigurasi endpoint LLM, model percakapan, dan API key untuk agen aduan.
          </p>
        </div>

        {/* Security Alert PRD */}
        <div className="bg-slate-50 text-slate-600 p-3.5 rounded-xl border border-slate-200 text-xs leading-relaxed">
          <strong>Keamanan Kunci (PRD Pasal 8.9):</strong> Kunci API disimpan terenkripsi di server dan tidak pernah diekspos ke publik/browser. Biarkan kolom API Key kosong jika Anda ingin mempertahankan kunci yang sudah tersimpan.
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              Parameter Model & Endpoint
            </h3>
            {config.configured && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                Aktif
              </span>
            )}
          </div>

          {saveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Pengaturan provider AI berhasil diperbarui dan aktif di sistem.</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            {/* Endpoint */}
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                URL Endpoint Lengkap
              </label>
              <div className="relative">
                <input
                  type="url"
                  required
                  value={endpoint}
                  onChange={(e) => setEndpoint(e.target.value)}
                  placeholder="https://api.openai.com/v1/chat/completions"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#008069] focus:ring-1 focus:ring-[#008069] text-xs sm:text-sm font-mono text-slate-800 outline-none"
                />
                <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Wajib berupa URL protokol HTTPS lengkap yang mendukung spesifikasi chat completions standar.
              </p>
            </div>

            {/* Model Name */}
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                Nama Model (Harus Mendukung Tool Calling)
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Contoh: gpt-4o-mini, claude-3-5-sonnet-20241022, gemini-1.5-flash"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#008069] focus:ring-1 focus:ring-[#008069] text-xs sm:text-sm font-mono text-slate-800 outline-none"
                />
                <Bot className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* API Key */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                  API Key Kredensial
                </label>
                {config.hasApiKey && !isEditingKey && (
                  <button
                    type="button"
                    onClick={() => setIsEditingKey(true)}
                    className="text-xs text-[#008069] font-semibold hover:underline"
                  >
                    Ganti API Key
                  </button>
                )}
              </div>

              <div className="relative">
                {config.hasApiKey && !isEditingKey ? (
                  <div className="flex items-center justify-between w-full pl-10 pr-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-500">
                    <span>••••••••••••••••••••••••••••••••</span>
                    <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-sans font-semibold">
                      Tersimpan di Vault
                    </span>
                  </div>
                ) : (
                  <input
                    type="password"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="Masukkan sk-..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:border-[#008069] focus:ring-1 focus:ring-[#008069] text-xs sm:text-sm font-mono text-slate-800 outline-none"
                  />
                )}
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
              <p className="text-[11px] text-slate-400">
                {config.hasApiKey
                  ? "Biarkan kosong untuk mempertahankan kunci yang sedang aktif."
                  : "Kunci wajib diisi pada saat inisialisasi awal."}
              </p>
            </div>

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#008069] hover:bg-[#075e54] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-xs transition-all active:scale-[0.98] cursor-pointer"
              >
                <span>Simpan Konfigurasi</span>
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="w-full sm:w-auto px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#008069]" />
                    <span>Menguji Ping...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Uji Ping Koneksi</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Test connection result */}
          {testResult && (
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed space-y-1 ${
                testResult.success
                  ? "bg-emerald-50 border-emerald-200 text-emerald-900"
                  : "bg-rose-50 border-rose-200 text-rose-900"
              }`}
            >
              <div className="font-bold flex items-center gap-1.5">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600" />
                )}
                <span>{testResult.success ? "Hasil Uji Koneksi Sukses" : "Uji Koneksi Gagal"}</span>
              </div>
              <p>{testResult.message}</p>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
