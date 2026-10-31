"use client";

import React from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { MockService, INITIAL_COMPLAINTS } from "@/lib/mock-service";
import StatusBadge from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import { ArrowRight, ShieldCheck } from "lucide-react";
import { useIsMounted } from "@/lib/use-is-mounted";

export default function AdminDashboardPage() {
  const isMounted = useIsMounted();
  const complaints = isMounted ? MockService.getComplaints() : INITIAL_COMPLAINTS;
  const metrics = isMounted
    ? MockService.getDashboardMetrics()
    : {
        TOTAL: INITIAL_COMPLAINTS.length,
        NEW: INITIAL_COMPLAINTS.filter((c) => c.status === "NEW").length,
        ACCEPTED: INITIAL_COMPLAINTS.filter((c) => c.status === "ACCEPTED").length,
        IN_PROGRESS: INITIAL_COMPLAINTS.filter((c) => c.status === "IN_PROGRESS").length,
        RESOLVED: INITIAL_COMPLAINTS.filter((c) => c.status === "RESOLVED").length,
        REJECTED: INITIAL_COMPLAINTS.filter((c) => c.status === "REJECTED").length,
      };
  const recentComplaints = complaints.slice(0, 6);

  const stats = [
    { label: "Semua Laporan", count: metrics.TOTAL, href: "/admin/aduan" },
    { label: "Menunggu Validasi", count: metrics.NEW, href: "/admin/aduan?status=NEW", highlight: true },
    { label: "Diterima", count: metrics.ACCEPTED, href: "/admin/aduan?status=ACCEPTED" },
    { label: "Sedang Ditangani", count: metrics.IN_PROGRESS, href: "/admin/aduan?status=IN_PROGRESS" },
    { label: "Selesai", count: metrics.RESOLVED, href: "/admin/aduan?status=RESOLVED" },
    { label: "Ditolak", count: metrics.REJECTED, href: "/admin/aduan?status=REJECTED" },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Meja Ringkasan Operasional
            </h1>
            <p className="text-xs text-slate-500">
              Pemantauan aduan warga dan validasi berkas penanganan dinas.
            </p>
          </div>

          <Link
            href="/admin/aduan"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#008069] hover:bg-[#075e54] text-white text-xs font-semibold transition-colors"
          >
            <span>Buka Semua Aduan</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Minimalist Flat KPI Strip (No AI-slop icon cards) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-slate-200 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
          {stats.map((s, idx) => (
            <Link
              key={idx}
              href={s.href}
              className="bg-white p-4 hover:bg-slate-50 transition-colors flex flex-col justify-between space-y-2 group"
            >
              <span className="text-[11px] text-slate-500 font-medium block">
                {s.label}
              </span>
              <div className="flex items-baseline justify-between">
                <span className={`text-2xl font-bold font-mono ${s.highlight ? "text-[#008069]" : "text-slate-900"}`}>
                  {s.count}
                </span>
                {s.highlight && s.count > 0 && (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    Aksi
                  </span>
                )}
              </div>
            </Link>
          ))}
        </div>

        {/* Quiet Privacy Note */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            <strong>Mode Anonim:</strong> Sesuai PRD Pasal 8.5, nomor kontak warga dilindungi di sisi server dan tidak ditampilkan di layar petugas.
          </span>
        </div>

        {/* Recent Complaints Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              Laporan Terkini
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Terbaru dari sistem
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-400 uppercase font-mono text-[10px] border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-4 font-semibold">Tiket</th>
                  <th className="py-2.5 px-4 font-semibold">Kategori</th>
                  <th className="py-2.5 px-4 font-semibold">Intisari Aduan</th>
                  <th className="py-2.5 px-4 font-semibold">Status</th>
                  <th className="py-2.5 px-4 font-semibold">Waktu</th>
                  <th className="py-2.5 px-4 text-right font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentComplaints.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono font-bold text-[#008069]">
                      {item.ticketNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-sm truncate">
                      {item.aiSummary}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/aduan/${item.id}`}
                        className="text-xs font-semibold text-[#008069] hover:underline"
                      >
                        Tinjau & Verifikasi
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
