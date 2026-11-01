"use client";

import { Suspense, use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/AdminLayout';
import StatusBadge from '@/components/StatusBadge';
import { adminFetch } from '@/lib/auth/admin-session';
import { ALLOWED_STATUS_TRANSITIONS, type ComplaintStatus } from '@/types/complaint';
import { formatDateTime } from '@/lib/utils';

type Detail = {
  id: string; ticketNumber: string; category: string | null; aiSummary: string;
  description: string; status: ComplaintStatus; createdAt: string;
  updates: { id: string; status: ComplaintStatus; note: string | null; createdAt: string;
    evidence: { id: string; fileName: string; url?: string }[] }[];
};
const labels: Record<ComplaintStatus, string> = {
  NEW: 'Baru', ACCEPTED: 'Diterima', IN_PROGRESS: 'Sedang ditangani', RESOLVED: 'Selesai', REJECTED: 'Ditolak',
};

function AdminComplaintDetailContent({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [complaint, setComplaint] = useState<Detail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [status, setStatus] = useState<ComplaintStatus | ''>('');
  const [note, setNote] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await adminFetch(`/api/admin/complaints/${encodeURIComponent(id)}`, { cache: 'no-store' });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || 'Gagal memuat laporan');
      setComplaint(body.data as Detail);
      setError(null);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal memuat laporan'); }
    finally { setLoading(false); }
  }, [id]);
  useEffect(() => { void Promise.resolve().then(load); }, [load]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!status || !file) { setError('Pilih status dan satu berkas bukti.'); return; }
    if (status === 'REJECTED' && !rejectionReason.trim()) { setError('Alasan penolakan wajib diisi.'); return; }
    if (file.size > 4_000_000) { setError('Berkas maksimal 4 MB.'); return; }
    setSaving(true); setError(null); setNotice(null);
    const form = new FormData();
    form.set('status', status); form.set('note', note);
    form.set('rejectionReason', rejectionReason); form.set('files', file);
    try {
      const response = await adminFetch(`/api/admin/complaints/${encodeURIComponent(id)}/updates`, { method: 'POST', body: form });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error?.message || 'Gagal mengubah status');
      setNotice(body.data.notificationStatus === 'QUEUED'
        ? 'Status tersimpan. Pembaruan beserta tautan bukti masuk antrean WhatsApp.'
        : 'Status tersimpan, tetapi WhatsApp gagal diantrekan. Periksa sambungan WhatsApp.');
      setStatus(''); setNote(''); setRejectionReason(''); setFile(null);
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Gagal mengubah status'); }
    finally { setSaving(false); }
  };

  const next = complaint ? ALLOWED_STATUS_TRANSITIONS[complaint.status] : [];
  return <AdminLayout><div className="admin-page admin-page-detail space-y-5">
    <Link href="/admin/aduan" className="text-sm font-semibold text-primary hover:underline">← Kembali ke daftar aduan</Link>
    {loading && <p className="text-sm text-slate-600">Memuat laporan...</p>}
    {error && <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {complaint && <>
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4"><div>
          <p className="text-sm text-slate-600">{complaint.category ?? 'Aduan warga'}</p>
          <h1 className="text-xl font-bold font-mono text-slate-900">{complaint.ticketNumber}</h1>
          <p className="mt-1 text-xs text-slate-500">Masuk {formatDateTime(complaint.createdAt)}</p>
        </div><StatusBadge status={complaint.status} size="md" /></div>
        <div><h2 className="text-xs font-semibold uppercase text-slate-500">Ringkasan aduan</h2><p className="mt-1 text-sm font-semibold text-slate-900">{complaint.aiSummary}</p></div>
        <div><h2 className="text-xs font-semibold uppercase text-slate-500">Uraian</h2><p className="mt-1 text-sm leading-relaxed text-slate-700">{complaint.description}</p></div>
      </section>
      {next.length > 0 && <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6 space-y-4">
        <div><h2 className="font-bold text-slate-900">Perbarui status</h2><p className="text-sm text-slate-600">Satu bukti wajib diunggah. Setelah tersimpan, tautannya dikirim melalui WhatsApp.</p></div>
        {notice && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-primary">{notice}</p>}
        <form onSubmit={submit} className="space-y-4">
          <fieldset><legend className="mb-2 text-sm font-semibold text-slate-700">Status baru</legend><div className="flex flex-wrap gap-2">{next.map((value) =>
            <button type="button" key={value} onClick={() => setStatus(value)} className={`rounded-lg border px-4 py-2 text-sm font-semibold ${status === value ? 'border-primary bg-primary text-white' : 'border-slate-200 text-slate-700'}`}>{labels[value]}</button>)}</div></fieldset>
          <label className="block text-sm font-semibold text-slate-700">Catatan untuk pengadu
            <textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} className="mt-1 block w-full rounded-lg border border-slate-200 p-3 font-normal outline-none focus:border-primary" /></label>
          {status === 'REJECTED' && <label className="block text-sm font-semibold text-slate-700">Alasan penolakan
            <textarea required value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} rows={3} className="mt-1 block w-full rounded-lg border border-slate-200 p-3 font-normal outline-none focus:border-primary" /></label>}
          <label className="block text-sm font-semibold text-slate-700">Bukti foto atau PDF
            <input type="file" required accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="mt-1 block w-full rounded-lg border border-slate-200 p-3 text-sm font-normal" /></label>
          <button disabled={saving} className="rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">{saving ? 'Menyimpan...' : 'Simpan status dan kirim WhatsApp'}</button>
        </form>
      </section>}
      {notice && next.length === 0 && <p role="status" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-primary">{notice}</p>}
      <section className="rounded-xl border border-slate-200 bg-white p-5 sm:p-6"><h2 className="font-bold text-slate-900">Riwayat status</h2>
        {complaint.updates.length === 0 ? <p className="mt-3 text-sm text-slate-600">Belum ada perubahan status.</p> : <ol className="mt-4 space-y-4">
          {complaint.updates.map((update) => <li key={update.id} className="border-t border-slate-100 pt-4 text-sm"><div className="flex flex-wrap items-center gap-3"><StatusBadge status={update.status} size="sm" /><time className="text-slate-500">{formatDateTime(update.createdAt)}</time></div>
            {update.note && <p className="mt-2 text-slate-700">{update.note}</p>}
            {update.evidence.map((evidence) => evidence.url && <a key={evidence.id} href={evidence.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block font-semibold text-primary underline">Buka bukti: {evidence.fileName || 'Berkas'}</a>)}
          </li>)}</ol>}
      </section>
    </>}
  </div></AdminLayout>;
}


export default function AdminComplaintDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return <Suspense fallback={<p>Memuat laporan...</p>}><AdminComplaintDetailContent params={params} /></Suspense>;
}
