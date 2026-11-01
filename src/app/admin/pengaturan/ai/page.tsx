"use client";

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetch } from '@/lib/auth/admin-session';

export default function AiSettingsPage() {
  const [endpoint, setEndpoint] = useState('');
  const [model, setModel] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [configured, setConfigured] = useState(false);
  const [knowledge, setKnowledge] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [savingKnowledge, setSavingKnowledge] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([adminFetch('/api/admin/ai-provider'), adminFetch('/api/admin/ai/main-knowledge')])
      .then(async ([provider, main]) => {
        const [a, b] = await Promise.all([provider.json(), main.json()]);
        if (!provider.ok || !main.ok) throw new Error('Gagal memuat pengaturan AI.');
        if (active) { setEndpoint(a.data.endpoint); setModel(a.data.model); setConfigured(a.data.configured); setKnowledge(b.data.mainKnowledge); }
      }).catch((error) => { if (active) setMessage(error.message || 'Gagal memuat pengaturan AI.'); });
    return () => { active = false; };
  }, []);
  const saveProvider = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setMessage(null);
    try {
      const response = await adminFetch('/api/admin/ai-provider', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint, model, apiKey }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error?.message || 'Gagal menyimpan provider.');
      setApiKey(''); setConfigured(true); setMessage('Pengaturan provider tersimpan.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Gagal menyimpan provider.'); }
    finally { setSaving(false); }
  };
  const saveKnowledge = async (event: React.FormEvent) => {
    event.preventDefault(); setSavingKnowledge(true); setMessage(null);
    try {
      const response = await adminFetch('/api/admin/ai/main-knowledge', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ mainKnowledge: knowledge }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error?.message || 'Gagal menyimpan Main Knowledge.');
      setKnowledge(body.data.mainKnowledge); setMessage('Main Knowledge tersimpan.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Gagal menyimpan Main Knowledge.'); }
    finally { setSavingKnowledge(false); }
  };
  return <AdminLayout><div className="admin-page admin-page-narrow space-y-5">
    <div><h1 className="text-xl font-bold text-slate-900">Pengaturan AI</h1><p className="text-sm text-slate-600">Atur penyedia AI dan informasi dasar layanan.</p></div>
    {message && <p role="status" className="rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-700">{message}</p>}
    <form onSubmit={saveProvider} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">Sambungan AI</h2>
      <label className="block text-sm font-medium">URL endpoint<input type="url" required value={endpoint} onChange={(e) => setEndpoint(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-primary" /></label>
      <label className="block text-sm font-medium">Model<input required value={model} onChange={(e) => setModel(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-primary" /></label>
      <label className="block text-sm font-medium">API key<input type="password" autoComplete="off" required={!configured} value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder={configured ? 'Kosongkan untuk mempertahankan key' : 'Masukkan API key'} className="mt-1 block w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-primary" /></label>
      <button disabled={saving} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{saving ? 'Menyimpan...' : 'Simpan provider'}</button>
    </form>
    <form onSubmit={saveKnowledge} className="space-y-4 rounded-xl border border-slate-200 bg-white p-5"><div><h2 className="font-semibold text-slate-900">Main Knowledge</h2><p className="text-sm text-slate-600">Informasi wilayah dan layanan yang selalu tersedia untuk AI.</p></div>
      <label className="block text-sm font-medium">Informasi dasar<textarea maxLength={3000} rows={8} value={knowledge} onChange={(e) => setKnowledge(e.target.value)} className="mt-1 block w-full rounded-lg border border-slate-200 p-3 outline-none focus:border-primary" /></label>
      <div className="flex items-center justify-between"><span className="text-xs text-slate-500">{knowledge.length} / 3000 karakter</span><button disabled={savingKnowledge} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{savingKnowledge ? 'Menyimpan...' : 'Simpan informasi'}</button></div>
    </form>
  </div></AdminLayout>;
}
