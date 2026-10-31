"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import AdminLayout from "@/components/AdminLayout";
import { MockService, INITIAL_COMPLAINTS } from "@/lib/mock-service";
import { ComplaintStatus } from "@/types/complaint";
import StatusBadge from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import { Search, Inbox, Eye } from "lucide-react";
import { useIsMounted } from "@/lib/use-is-mounted";

const FILTER_TABS: { key: string; label: string; status?: ComplaintStatus }[] =
  [
    { key: "ALL", label: "Semua Aduan" },
    { key: "NEW", label: "Baru", status: "NEW" },
    { key: "ACCEPTED", label: "Diterima", status: "ACCEPTED" },
    { key: "IN_PROGRESS", label: "Diproses", status: "IN_PROGRESS" },
    { key: "RESOLVED", label: "Selesai", status: "RESOLVED" },
    { key: "REJECTED", label: "Ditolak", status: "REJECTED" },
  ];

function AdminAduanListContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get("status") || "ALL";
  const isMounted = useIsMounted();

  const complaints = isMounted
    ? MockService.getComplaints()
    : INITIAL_COMPLAINTS;
  const [activeTab, setActiveTab] = useState(initialStatus);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredComplaints = useMemo(() => {
    return complaints.filter((item) => {
      // Tab filter
      if (activeTab !== "ALL" && item.status !== activeTab) {
        return false;
      }
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchTicket = item.ticketNumber.toLowerCase().includes(query);
        const matchCategory = item.category.toLowerCase().includes(query);
        const matchSummary = item.aiSummary.toLowerCase().includes(query);
        const matchDesc = item.description.toLowerCase().includes(query);
        return matchTicket || matchCategory || matchSummary || matchDesc;
      }
      return true;
    });
  }, [complaints, activeTab, searchQuery]);

  return (
    <div className="admin-page">
      {/* Header Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">
            Daftar aduan
          </h1>
          <p className="text-xs text-slate-500">
            Daftar pengaduan warga, status penanganan, dan verifikasi bukti
            dinas.
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-2.5">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            const count =
              tab.key === "ALL"
                ? complaints.length
                : complaints.filter((c) => c.status === tab.key).length;

            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                  isActive
                    ? "bg-primary text-white"
                    : "bg-slate-100 hover:bg-slate-200/70 text-slate-700"
                }`}
              >
                <span>{tab.label}</span>
                <span className="text-[10px] font-mono opacity-80">
                  ({count})
                </span>
              </button>
            );
          })}
        </div>

        {/* Search box */}
        <div className="relative">
          <input
            type="text"
            placeholder="Cari berdasarkan tiket, kategori, atau uraian..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 focus:border-primary text-xs text-slate-800 outline-none"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Complaints Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredComplaints.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <Inbox className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-slate-800 text-sm">
              Tidak Ada Aduan Ditemukan
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Tidak ada laporan yang sesuai dengan tab status atau kata kunci
              pencarian yang dipilih.
            </p>
          </div>
        ) : (
          <>
          <p className="admin-scroll-hint admin-scroll-hint-row">Geser tabel untuk melihat kolom lainnya</p>
          <div className="admin-data-scroll" role="region" aria-label="Tabel semua aduan, gulir horizontal untuk kolom lainnya" tabIndex={0}>
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th className="py-3.5 px-4">Nomor Tiket</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Intisari Laporan AI</th>
                  <th className="py-3.5 px-4">Status Terkini</th>
                  <th className="py-3.5 px-4">Tanggal Masuk</th>
                  <th className="py-3.5 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredComplaints.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-50/70 transition-colors"
                  >
                    <td className="py-3.5 px-4 font-semibold text-primary">
                      {item.ticketNumber}
                    </td>
                    <td className="py-3.5 px-4" title={item.category}>
                      <span className="font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600" title={item.aiSummary}>
                      <p>
                        {item.aiSummary}
                      </p>
                    </td>
                    <td className="py-3.5 px-4">
                      <StatusBadge status={item.status} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {formatDateTime(item.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/admin/aduan/${item.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary hover:bg-dark text-white font-semibold transition-colors shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Detail</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>
    </div>
  );
}

export default function AdminAduanListPage() {
  return (
    <AdminLayout>
      <Suspense
        fallback={
          <div className="p-8 text-center text-xs text-slate-500">
            Memuat meja kerja aduan...
          </div>
        }
      >
        <AdminAduanListContent />
      </Suspense>
    </AdminLayout>
  );
}
