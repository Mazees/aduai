"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import StatusBadge from "@/components/StatusBadge";
import { adminFetch } from "@/lib/auth/admin-session";
import { formatDateTime } from "@/lib/utils";
import type { ComplaintStatus } from "@/types/complaint";

type Counts = { total: number; counts: Record<ComplaintStatus, number> };
type Item = {
  id: string;
  ticketNumber: string;
  aiSummary: string;
  status: ComplaintStatus;
  createdAt: string;
};
const statusLabels: { key: ComplaintStatus; label: string }[] = [
  { key: "NEW", label: "Baru" },
  { key: "ACCEPTED", label: "Diterima" },
  { key: "IN_PROGRESS", label: "Diproses" },
  { key: "RESOLVED", label: "Selesai" },
  { key: "REJECTED", label: "Ditolak" },
];

export default function AdminDashboardPage() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [recent, setRecent] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    Promise.all([
      adminFetch("/api/admin/dashboard", { cache: "no-store" }),
      adminFetch("/api/admin/complaints?limit=5", { cache: "no-store" }),
    ])
      .then(async ([summary, list]) => {
        const [summaryBody, listBody] = await Promise.all([
          summary.json(),
          list.json(),
        ]);
        if (!summary.ok || !list.ok)
          throw new Error(
            summaryBody.error?.message ||
              listBody.error?.message ||
              "Gagal memuat dashboard",
          );
        if (active) {
          setCounts(summaryBody.data);
          setRecent(listBody.data.items);
        }
      })
      .catch((cause) => {
        if (active)
          setError(
            cause instanceof Error ? cause.message : "Gagal memuat dashboard",
          );
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <AdminLayout>
      <div className="admin-page space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">
              Ringkasan aduan
            </h1>
            <p className="text-sm text-slate-600">
              Pantau laporan yang masuk dan penanganannya.
            </p>
          </div>
          <Link
            href="/admin/aduan"
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white"
          >
            Buka semua aduan →
          </Link>
        </div>
        {error && (
          <p
            role="alert"
            className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
          >
            {error}
          </p>
        )}
        {!counts && !error && (
          <p className="text-sm text-slate-600">Memuat ringkasan...</p>
        )}
        {counts && (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl flex flex-col justify-center items-center border border-slate-200 bg-white p-4 hover:border-primary">
              <p className="text-xs text-slate-600">Semua</p>
              <p className="mt-2 text-2xl font-bold text-primary">
                {counts.total}
              </p>
            </div>
            {statusLabels.map(({ key, label }) => (
              <Link
                key={key}
                href="/admin/aduan"
                className="rounded-xl flex flex-col justify-center items-center border border-slate-200 bg-white p-4 hover:border-primary"
              >
                <p className="text-xs text-slate-600">{label}</p>
                <p className="mt-2 text-2xl font-bold text-primary">
                  {counts.counts[key]}
                </p>
              </Link>
            ))}
          </div>
        )}
        <section className="rounded-xl border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-900">Laporan terbaru</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recent.map((item) => (
              <Link
                href={`/admin/aduan/${item.id}`}
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="font-mono text-sm font-semibold text-primary">
                    {item.ticketNumber}
                  </p>
                  <p className="max-w-xl truncate text-sm text-slate-700">
                    {item.aiSummary}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={item.status} size="sm" />
                  <span className="text-xs text-slate-500">
                    {formatDateTime(item.createdAt)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
          {counts && recent.length === 0 && (
            <p className="px-5 py-4 text-sm text-slate-600">
              Belum ada laporan.
            </p>
          )}
        </section>
      </div>
    </AdminLayout>
  );
}
