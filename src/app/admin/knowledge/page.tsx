"use client";
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetch } from '@/lib/auth/admin-session';

type Item = { id: string; title: string; content: string; status: 'draft' | 'published'; source_url: string | null };
const empty = { title: '', content: '', status: 'published' as 'draft' | 'published', sourceUrl: '' };
export default function KnowledgePage() {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState(empty);
  const [editing, setEditing] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const words = form.content.trim() ? form.content.trim().split(/\s+/).length : 0;
  const load = async () => { const response = await adminFetch('/api/admin/knowledge'); const body = await response.json(); if (!response.ok) throw new Error(body.error?.message || 'Gagal memuat pengetahuan'); setItems(body.data); };
  useEffect(() => { void Promise.resolve().then(load).catch((e) => setError(e.message)); }, []);
  const save = async (event: React.FormEvent) => {
    event.preventDefault(); if (words > 1500) { setError('Isi maksimal 1.500 kata.'); return; }
    setBusy(true); setError(null);
    try {
      const response = await adminFetch(editing ? `/api/admin/knowledge/${editing}` : '/api/admin/knowledge', { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, sourceUrl: form.sourceUrl || null }) });
      const body = await response.json(); if (!response.ok) throw new Error(body.error?.message || 'Gagal menyimpan pengetahuan');
      setOpen(false); setEditing(null); setForm(empty); await load();
    } catch (e) { setError(e instanceof Error ? e.message : 'Gagal menyimpan pengetahuan'); }
    finally { setBusy(false); }
  };
  const remove = async (item: Item) => {
    if (!window.confirm(`Hapus informasi “${item.title}”?`)) return;
    setError(null);
    try { const response = await adminFetch(`/api/admin/knowledge/${item.id}`, { method: 'DELETE' }); if (!response.ok) throw new Error('Gagal menghapus pengetahuan'); await load(); }
    catch (e) { setError(e instanceof Error ? e.message : 'Gagal menghapus pengetahuan'); }
  };
  return <AdminLayout><div className="admin-page space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-xl font-bold text-slate-900">Pengetahuan AI</h1><p className="text-sm text-slate-600">Informasi yang dapat dicari asisten saat membantu warga.</p></div><button onClick={() => { setForm(empty); setEditing(null); setError(null); setOpen(true); }} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white">Tambah informasi</button></div>
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    <div className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">{items.map((item) => <article key={item.id} className="flex flex-wrap items-start justify-between gap-3 p-5"><div className="min-w-0"><h2 className="font-semibold text-slate-900">{item.title}</h2><p className="mt-1 line-clamp-2 text-sm text-slate-600">{item.content}</p><p className="mt-2 text-xs text-slate-500">{item.status === 'published' ? 'Dipublikasikan' : 'Draft'}</p></div><div className="flex gap-3 text-sm font-semibold text-primary"><button onClick={() => { setEditing(item.id); setForm({ title: item.title, content: item.content, status: item.status, sourceUrl: item.source_url || '' }); setOpen(true); }}>Ubah</button><button onClick={() => void remove(item)} className="text-rose-700">Hapus</button></div></article>)}{!items.length && <p className="p-5 text-sm text-slate-600">Belum ada informasi.</p>}</div>
    {open && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(event) => { if (event.target === event.currentTarget && !busy) setOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="knowledge-title" className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6"><div className="flex justify-between gap-4"><h2 id="knowledge-title" className="text-lg font-bold">{editing ? 'Ubah informasi' : 'Tambah informasi baru'}</h2><button type="button" onClick={() => setOpen(false)} aria-label="Tutup">✕</button></div>
      <form onSubmit={save} className="mt-5 space-y-4"><label className="block text-sm font-semibold">Judul informasi<input autoFocus required maxLength={200} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-200 p-3 font-normal" /></label>
      <label className="block text-sm font-semibold">Isi penjelasan <span className="float-right text-xs text-slate-500">{words} / 1500 kata</span><textarea required rows={8} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-200 p-3 font-normal" /></label>
      <label className="block text-sm font-semibold">Tautan sumber (opsional)<input type="url" value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} className="mt-1 block w-full rounded-lg border border-slate-200 p-3 font-normal" /></label>
      <label className="block text-sm font-semibold">Status<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Item['status'] })} className="mt-1 block w-full rounded-lg border border-slate-200 p-3 font-normal"><option value="published">Publikasikan</option><option value="draft">Draft</option></select></label>
      <div className="flex justify-end gap-3"><button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm">Batal</button><button disabled={busy || words > 1500} className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Membuat embedding...' : 'Simpan informasi'}</button></div></form></section></div>}
  </div></AdminLayout>;
}
