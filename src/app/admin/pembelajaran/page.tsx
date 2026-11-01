"use client";
import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { adminFetch } from '@/lib/auth/admin-session';
import { formatDateTime } from '@/lib/utils';

type Prompt = { type: 'POSITIVE' | 'NEGATIVE'; content: string };
type Evaluation = { id: string; complaintId: string; status: string; summary: string | null; errorCode: string | null; hasNewLearning: boolean; positivePrompts: string[]; negativePrompts: string[]; createdAt: string };
type Data = { counts: { total: number; success: number; pending: number; inProgress: number; failed: number; withNewLearning: number }; analytics: Record<'week' | 'month' | 'year', { date: string; created: number; completed: number }[]>; recentEvaluations: Evaluation[]; activePrompts: Prompt[] };
const failureMessages: Record<string, string> = {
  AI_NOT_CONFIGURED: 'Pengaturan provider AI belum lengkap.',
  AI_INVALID_ENDPOINT: 'Alamat provider AI tidak valid.',
  AI_PROVIDER_ERROR: 'Provider AI menolak atau gagal memproses permintaan.',
  AI_PROVIDER_AUTH_ERROR: 'API key provider AI ditolak. Periksa pengaturan AI.',
  AI_PROVIDER_RATE_LIMIT: 'Batas penggunaan atau kuota provider AI tercapai.',
  AI_PROVIDER_UNAVAILABLE: 'Provider AI sedang tidak tersedia.',
  AI_STREAM_UNSUPPORTED: 'Provider AI tidak menyediakan respons streaming.',
  AI_INCOMPLETE_RESPONSE: 'Respons provider AI tidak selesai.',
  AI_INVALID_RESPONSE: 'Format respons provider AI tidak dikenali.',
  AI_INVALID_TOOL_CALL: 'Format pemanggilan tool dari model tidak valid.',
  EVALUATION_TIMEOUT: 'Proses belajar melewati batas waktu.',
  EVALUATION_LOOP_LIMIT: 'Model tidak menyelesaikan proses belajar dalam batas percobaan.',
  EVALUATION_TOOL_LIMIT: 'Model melampaui batas penggunaan tool.',
  EVALUATION_SAVE_FAILED: 'Hasil pembelajaran gagal disimpan.',
};
const labels: Record<string, string> = { PENDING: 'Menunggu', IN_PROGRESS: 'Sedang belajar', SUCCESS: 'Selesai', FAILED: 'Gagal' };
export default function LearningPage() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  useEffect(() => { let active = true; adminFetch('/api/admin/learning', { cache: 'no-store' }).then(async (response) => { const body = await response.json(); if (!response.ok) throw new Error(body.error?.message || 'Gagal memuat pembelajaran'); if (active) setData(body.data); }).catch((cause) => { if (active) setError(cause.message || 'Gagal memuat pembelajaran'); }); return () => { active = false; }; }, []);
  const positive = data?.activePrompts.filter((p) => p.type === 'POSITIVE').slice(0, 10) ?? [];
  const negative = data?.activePrompts.filter((p) => p.type === 'NEGATIVE').slice(0, 10) ?? [];
  return <AdminLayout><div className="admin-page space-y-5">
    <div><h1 className="text-xl font-bold text-slate-900">Pembelajaran AI</h1><p className="text-sm text-slate-600">Pantau perkembangan AI dalam belajar merespons warga.</p></div>
    {error && <p role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {!data && !error && <p role="status" className="text-sm text-slate-600">Memuat pembelajaran...</p>}
    {data && <><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[['Proses belajar', data.counts.total], ['Selesai', data.counts.success], ['Menunggu', data.counts.pending + data.counts.inProgress], ['Gagal', data.counts.failed]].map(([label, count]) => <div key={label} className="rounded-xl border border-slate-200 bg-white p-4"><p className="text-xs text-slate-500">{label}</p><p className="mt-1 text-xl font-bold text-primary">{count}</p></div>)}</div>
      <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">Perkembangan AI dalam belajar</h2><p className="mt-1 text-sm text-slate-600">Lihat proses belajar AI yang dimulai dan selesai dari waktu ke waktu.</p>
        <div className="mt-3 flex flex-wrap gap-2">{([['week', '7 hari'], ['month', '1 bulan'], ['year', '1 tahun']] as const).map(([key, label]) => <button type="button" key={key} onClick={() => setPeriod(key)} aria-pressed={period === key} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${period === key ? 'bg-primary text-white' : 'bg-slate-100 text-slate-700'}`}>{label}</button>)}</div>
        <div className="mt-4 flex gap-4 text-xs text-slate-600"><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-primary" />Dibuat</span><span><span className="mr-1 inline-block h-2 w-2 rounded-full bg-secondary" />Selesai</span></div>
        <div className="mt-4 flex h-40 items-end gap-2" aria-label="Grafik perkembangan AI dalam belajar">{data.analytics[period].map((day) => { const maximum = Math.max(1, ...data.analytics[period].flatMap((d) => [d.created, d.completed])); return <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-2"><div className="flex h-28 w-full items-end justify-center gap-1" title={day.date + ': ' + day.created + ' dibuat, ' + day.completed + ' selesai'}><div className="w-4 rounded-t bg-primary" style={{ height: (day.created / maximum * 100) + '%' }} /><div className="w-4 rounded-t bg-secondary" style={{ height: (day.completed / maximum * 100) + '%' }} /></div><span className="text-xs text-slate-500">{period === 'year' ? day.date.slice(2).replace('-', '/') : period === 'month' && Number(day.date.slice(-2)) % 5 !== 0 ? '' : day.date.slice(5).split('-').reverse().join('/')}</span><span className="sr-only">{day.created} dibuat, {day.completed} selesai</span></div>; })}</div>
      </section>
      <div className="grid gap-4 md:grid-cols-2">{([{ title: 'Panduan positif', list: positive }, { title: 'Hal yang dihindari', list: negative }]).map((group) => <section key={group.title} className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">{group.title}</h2>{group.list.length ? <ul className="mt-3 space-y-2">{group.list.map((p, index) => <li key={index} className="rounded-lg bg-slate-50 p-3 text-sm text-slate-700">{p.content}</li>)}</ul> : <p className="mt-3 text-sm text-slate-500">Belum ada panduan.</p>}</section>)}</div>
      <section className="rounded-xl border border-slate-200 bg-white p-5"><h2 className="font-semibold text-slate-900">Riwayat pembelajaran</h2>{data.recentEvaluations.length ? <ol className="mt-3 divide-y divide-slate-100">{data.recentEvaluations.map((item) => <li key={item.id} className="space-y-1 py-4 text-sm"><div className="flex flex-wrap justify-between gap-2"><span className="font-semibold text-primary">{labels[item.status] || item.status}</span><time className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</time></div><p className="text-slate-700">{item.status === 'FAILED' ? (item.errorCode && failureMessages[item.errorCode] || 'Penyebab kegagalan belum tercatat. Periksa log server.') : (item.summary || 'Belum ada ringkasan.')}</p>{item.hasNewLearning && <p className="text-xs text-slate-500">Ada panduan komunikasi baru</p>}</li>)}</ol> : <p className="mt-3 text-sm text-slate-500">Belum ada riwayat pembelajaran.</p>}</section>
    </>}
  </div></AdminLayout>;
}
