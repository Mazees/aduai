"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import StatusBadge from '@/components/StatusBadge';
import { adminFetch } from '@/lib/auth/admin-session';
import { formatDateTime } from '@/lib/utils';
import type { ComplaintStatus } from '@/types/complaint';

type Item = { id: string; ticketNumber: string; category: string | null; aiSummary: string; status: ComplaintStatus; createdAt: string };
const tabs: { value: ComplaintStatus | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'Semua' }, { value: 'NEW', label: 'Baru' },
  { value: 'ACCEPTED', label: 'Diterima' }, { value: 'IN_PROGRESS', label: 'Diproses' },
  { value: 'RESOLVED', label: 'Selesai' }, { value: 'REJECTED', label: 'Ditolak' },
];

export default function AdminComplaintsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [status, setStatus] = useState<ComplaintStatus | 'ALL'>('ALL');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (status !== 'ALL') params.set('status', status);
    adminFetch(`/api/admin/complaints?${params}`, { cache: 'no-store' })
      .then(async (response) => {
        const body = await response.json();
        if (!response.ok) throw new Error(body.error?.message || 'Gagal memuat aduan');
        if (active) { setItems(body.data.items); setTotal(body.data.pagination.total); setError(null); }
      })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : 'Gagal memuat aduan'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, status]);

  const visible = useMemo(() => items.filter((item) => {
    const text = `${item.ticketNumber} ${item.category ?? ''} ${item.aiSummary}`.toLowerCase();
    return text.includes(query.trim().toLowerCase());
  }), [items, query]);

  return <AdminLayout><div className="admin-page space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3">
      <div><h1 className="text-xl font-bold text-slate-900">Daftar aduan</h1><p className="text-sm text-slate-600">Tinjau laporan dan perbarui status dengan bukti.</p></div>
      <span className="text-sm text-slate-600">{total} laporan</span>
    </div>
    <div className="flex flex-wrap gap-2" aria-label="Filter status">
      {tabs.map((tab) => <button key={tab.value} type="button" onClick={() => { setStatus(tab.value); setPage(1); setLoading(true); }}
        className={`rounded-lg px-3 py-2 text-sm font-medium ${status === tab.value ? 'bg-primary text-white' : 'border border-slate-200 bg-white text-slate-700'}`}>{tab.label}</button>)}
    </div>
    <label className="block"><span className="sr-only">Cari laporan di halaman ini</span><input value={query} onChange={(e) => setQuery(e.target.value)}
      placeholder="Cari nomor tiket atau ringkasan di halaman ini" className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-primary" /></label>
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {loading ? <p className="text-sm text-slate-600">Memuat aduan...</p> : <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="min-w-[800px] w-full text-left text-sm"><thead className="bg-slate-50 text-slate-600"><tr>
        <th className="px-4 py-3">Tiket</th><th className="px-4 py-3">Aduan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Dibuat</th><th className="px-4 py-3">Aksi</th>
      </tr></thead><tbody className="divide-y divide-slate-100">{visible.map((item) => <tr key={item.id}>
        <td className="px-4 py-3 font-mono font-semibold text-primary whitespace-nowrap">{item.ticketNumber}</td>
        <td className="px-4 py-3 max-w-[380px]"><p className="truncate font-medium text-slate-900">{item.aiSummary}</p><p className="text-xs text-slate-500">{item.category ?? 'Aduan warga'}</p></td>
        <td className="px-4 py-3 whitespace-nowrap"><StatusBadge status={item.status} size="sm" /></td>
        <td className="px-4 py-3 whitespace-nowrap text-slate-600">{formatDateTime(item.createdAt)}</td>
        <td className="px-4 py-3"><Link href={`/admin/aduan/${item.id}`} className="font-semibold text-primary hover:underline">Tinjau</Link></td>
      </tr>)}</tbody></table>
      {visible.length === 0 && <p className="p-5 text-sm text-slate-600">Tidak ada aduan pada halaman ini.</p>}
    </div>}
    <div className="flex items-center justify-end gap-3 text-sm"><button disabled={page === 1} onClick={() => { setPage(page - 1); setLoading(true); }} className="disabled:opacity-40">Sebelumnya</button>
      <span>Halaman {page}</span><button disabled={page * 20 >= total} onClick={() => { setPage(page + 1); setLoading(true); }} className="disabled:opacity-40">Berikutnya</button></div>
  </div></AdminLayout>;
}
