"use client";

import React from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { MockService, INITIAL_COMPLAINTS } from "@/lib/mock-service";
import StatusBadge from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import { ArrowRight } from "lucide-react";
import { useIsMounted } from "@/lib/use-is-mounted";

export default function AdminDashboardPage() {
  const isMounted = useIsMounted();
  const complaints = isMounted
    ? MockService.getComplaints()
    : INITIAL_COMPLAINTS;
  const metrics = isMounted
    ? MockService.getDashboardMetrics()
    : {
        TOTAL: INITIAL_COMPLAINTS.length,
        NEW: INITIAL_COMPLAINTS.filter((c) => c.status === "NEW").length,
        ACCEPTED: INITIAL_COMPLAINTS.filter((c) => c.status === "ACCEPTED")
          .length,
        IN_PROGRESS: INITIAL_COMPLAINTS.filter(
          (c) => c.status === "IN_PROGRESS",
        ).length,
        RESOLVED: INITIAL_COMPLAINTS.filter((c) => c.status === "RESOLVED")
          .length,
        REJECTED: INITIAL_COMPLAINTS.filter((c) => c.status === "REJECTED")
          .length,
      };
  const recentComplaints = complaints.slice(0, 6);

  const stats = [
    { label: "Semua Laporan", count: metrics.TOTAL, href: "/admin/aduan" },
    {
      label: "Menunggu Validasi",
      count: metrics.NEW,
      href: "/admin/aduan?status=NEW",
      highlight: true,
    },
    {
      label: "Diterima",
      count: metrics.ACCEPTED,
      href: "/admin/aduan?status=ACCEPTED",
    },
    {
      label: "Sedang Ditangani",
      count: metrics.IN_PROGRESS,
      href: "/admin/aduan?status=IN_PROGRESS",
    },
    {
      label: "Selesai",
      count: metrics.RESOLVED,
      href: "/admin/aduan?status=RESOLVED",
    },
    {
      label: "Ditolak",
      count: metrics.REJECTED,
      href: "/admin/aduan?status=REJECTED",
    },
  ];

  return (
    <AdminLayout>
      <div className="admin-page admin-dashboard">
        {/* Header */}
        <div className="admin-page-heading">
          <div>
            <h1>
              Ringkasan aduan
            </h1>
            <p>
              Pantau laporan warga dan perkembangan penanganannya.
            </p>
          </div>

          <Link
            href="/admin/aduan"
            className="admin-page-action"
          >
            <span>Lihat semua aduan</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="admin-stats">
          {stats.map((s, idx) => (
            <Link
              key={idx}
              href={s.href}
              className={`admin-stat ${s.highlight ? "admin-stat-priority" : ""}`}
            >
              <span className="admin-stat-label">
                {s.label}
              </span>
              <strong>{s.count}</strong>
            </Link>
          ))}
        </div>

        <div className="admin-table-panel">
          <div className="admin-table-heading">
            <h2>Laporan terbaru</h2>
            <span className="admin-scroll-hint">Geser tabel untuk melihat kolom lainnya</span>
          </div>

          <div className="admin-data-scroll" role="region" aria-label="Tabel laporan terbaru, gulir horizontal untuk kolom lainnya" tabIndex={0}>
            <table className="admin-data-table">
              <thead>
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
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-primary">
                      {item.ticketNumber}
                    </td>
                    <td className="py-3 px-4 text-slate-700" title={item.category}>
                      {item.category}
                    </td>
                    <td className="py-3 px-4 text-slate-600" title={item.aiSummary}>
                      {item.aiSummary}
                    </td>
                    <td className="py-3 px-4">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3 px-4 text-slate-500">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/admin/aduan/${item.id}`}
                        className="admin-table-link"
                      >
                        Lihat detail
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
