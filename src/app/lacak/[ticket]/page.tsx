"use client";

import React, { useState, useMemo, use, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { MockService } from "@/lib/mock-service";
import { Complaint, ComplaintStatus } from "@/types/complaint";
import StatusBadge from "@/components/StatusBadge";
import PublicLayout from "@/components/PublicLayout";
import { formatDateTime } from "@/lib/utils";
import {
  ArrowLeft,
  FileCheck2,
  Lock,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Paperclip,
  Check,
  Building2,
  Clock,
  Share2,
  ExternalLink,
} from "lucide-react";

interface DetailContentProps {
  params: Promise<{ ticket: string }>;
}

const STEP_ORDER: ComplaintStatus[] = ["NEW", "ACCEPTED", "IN_PROGRESS", "RESOLVED"];

const STEP_LABELS: Record<ComplaintStatus, string> = {
  NEW: "Laporan Diterima",
  ACCEPTED: "Diverifikasi Dinas",
  IN_PROGRESS: "Pengerjaan Lapangan",
  RESOLVED: "Selesai Berbukti",
  REJECTED: "Ditolak / Diarsipkan",
};

function LacakDetailContent({ params }: DetailContentProps) {
  const resolvedParams = use(params);
  const ticketNumber = decodeURIComponent(resolvedParams.ticket);
  const searchParams = useSearchParams();
  const codeParam = searchParams.get("code") || "";

  const initialVerification = useMemo(() => {
    if (codeParam) {
      return MockService.verifyTracking(ticketNumber, codeParam);
    }
    return null;
  }, [ticketNumber, codeParam]);

  const [inputCode, setInputCode] = useState(codeParam);
  const [complaint, setComplaint] = useState<Complaint | null>(
    () => initialVerification?.complaint || null
  );
  const [isVerified, setIsVerified] = useState<boolean>(
    () => Boolean(initialVerification?.success)
  );
  const [errorMsg, setErrorMsg] = useState<string | null>(() => {
    if (codeParam && initialVerification && !initialVerification.success) {
      return initialVerification.error || "Kode akses tidak cocok.";
    }
    if (!codeParam && !MockService.getComplaintByTicket(ticketNumber)) {
      return "Nomor tiket tidak ditemukan.";
    }
    return null;
  });
  const [activeEvidenceModal, setActiveEvidenceModal] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const handleManualVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const res = MockService.verifyTracking(ticketNumber, inputCode);
    if (res.success && res.complaint) {
      setComplaint(res.complaint);
      setIsVerified(true);
    } else {
      setErrorMsg(res.error || "Kode akses tidak cocok.");
    }
  };

  const handleCopyShareLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}/lacak/${encodeURIComponent(
        ticketNumber
      )}?code=${encodeURIComponent(complaint?.accessCode || inputCode)}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // If not yet verified with access code:
  if (!isVerified) {
    return (
      <div className="min-h-[calc(100vh-140px)] bg-[#f2f5f3] py-12 px-4 sm:px-6 flex items-center justify-center">
        <div className="bg-white rounded-3xl border border-slate-300/80 shadow-md p-6 sm:p-8 max-w-md w-full space-y-6">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#008069] flex items-center justify-center mx-auto border border-emerald-100">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
              Verifikasi Akses Laporan
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Tiket <span className="font-mono font-bold text-[#008069]">{ticketNumber}</span> dilindungi privasi. Harap masukkan kode akses 6-karakter Anda.
            </p>
          </div>

          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleManualVerify} className="space-y-4">
            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                Kode Akses (6 Karakter)
              </label>
              <input
                type="text"
                maxLength={6}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                placeholder="Contoh: W8X9K2"
                className="w-full py-3 px-4 rounded-xl border border-slate-200 focus:border-[#008069] focus:ring-1 focus:ring-[#008069] font-mono text-sm uppercase text-slate-800 outline-none transition-all tracking-widest text-center font-bold"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-xl font-extrabold text-xs bg-[#25d366] hover:bg-[#20ba59] text-[#075e54] flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>Buka Data Laporan Lengkap</span>
            </button>
          </form>

          <div className="text-center pt-2">
            <Link
              href="/lacak"
              className="text-xs text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Pencarian Tiket</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!complaint) return null;

  const isRejected = complaint.status === "REJECTED";
  const currentStepIndex = STEP_ORDER.indexOf(complaint.status);

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#f2f5f3] py-8 px-4 sm:px-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation & Action Bar */}
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/lacak"
            className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900 font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Cari Tiket</span>
          </Link>

          <button
            onClick={handleCopyShareLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-slate-300 text-[#075e54] text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-[#008069]" />
                <span className="text-[#008069]">Link Tersalin!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Salin Link Privat</span>
              </>
            )}
          </button>
        </div>

        {/* PROGRESS STEPPER (VISUAL STEP TIMELINE) */}
        {!isRejected ? (
          <div className="bg-white rounded-3xl border border-slate-300/80 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                Tahapan Pengerjaan Lapangan
              </span>
              <span className="text-xs font-bold text-[#008069]">
                {STEP_LABELS[complaint.status]}
              </span>
            </div>

            {/* Stepper Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {STEP_ORDER.map((stepKey, idx) => {
                const isPassed = currentStepIndex > idx;
                const isCurrent = currentStepIndex === idx;

                return (
                  <div
                    key={stepKey}
                    className={`p-3 rounded-2xl border transition-all text-xs space-y-1.5 ${
                      isCurrent
                        ? "bg-emerald-50/70 border-[#008069] shadow-xs"
                        : isPassed
                        ? "bg-slate-50 border-emerald-200 text-slate-700"
                        : "bg-white border-slate-200 text-slate-400"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono font-bold">
                        0{idx + 1}
                      </span>
                      {isPassed ? (
                        <div className="w-4 h-4 rounded-full bg-[#008069] text-white flex items-center justify-center text-[9px] font-bold">
                          ✓
                        </div>
                      ) : isCurrent ? (
                        <span className="w-2.5 h-2.5 rounded-full bg-[#25d366] animate-pulse" />
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-slate-200" />
                      )}
                    </div>
                    <p className={`font-bold text-[11px] leading-tight ${isCurrent ? "text-[#075e54]" : isPassed ? "text-slate-800" : "text-slate-400"}`}>
                      {STEP_LABELS[stepKey]}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="bg-rose-50 border border-rose-300 rounded-3xl p-5 shadow-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs text-rose-900">
              <span className="font-extrabold text-sm block">
                Laporan Ditolak / Diarsipkan
              </span>
              <p className="leading-relaxed">
                Laporan ini tidak dapat dilanjutkan oleh dinas terkait dengan alasan resmi yang tercatat di bawah.
              </p>
            </div>
          </div>
        )}

        {/* PRIMARY COMPLAINT TICKET SUMMARY */}
        <div className="bg-white rounded-3xl border border-slate-300/80 shadow-md overflow-hidden">
          {/* Header Band */}
          <div className="bg-[#075e54] text-white p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded bg-white/10 font-mono text-[10px] text-emerald-200 uppercase font-bold">
                  {complaint.category || "Infrastruktur Publik"}
                </span>
                <span className="text-white/40">•</span>
                <span className="text-xs text-emerald-100 flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  {formatDateTime(complaint.createdAt)}
                </span>
              </div>
              <h1 className="text-2xl font-black font-mono tracking-tight text-white">
                {complaint.ticketNumber}
              </h1>
            </div>

            <StatusBadge status={complaint.status} size="lg" />
          </div>

          <div className="p-6 space-y-5 text-xs">
            {/* Intisari */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Intisari Masalah
              </span>
              <p className="text-sm font-bold text-slate-900 leading-relaxed">
                {complaint.aiSummary}
              </p>
            </div>

            {/* Uraian */}
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Uraian & Lokasi Kejadian
              </span>
              <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed font-medium">
                {complaint.description}
              </p>
            </div>

            {/* Department Disposisi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 text-slate-800">
                <Building2 className="w-4 h-4 text-[#008069] shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 block">Unit Kerja Penanggung Jawab</span>
                  <span className="font-bold text-xs text-[#075e54]">{complaint.category || "Dinas Terkait"}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-800">
                <ShieldCheck className="w-4 h-4 text-[#008069] shrink-0" />
                <div>
                  <span className="text-[10px] text-slate-500 block">Status Privasi Pelapor</span>
                  <span className="font-bold text-xs text-slate-900">100% Terlindungi (Anonim)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* TIMELINE RIWAYAT PETUGAS RESMI */}
        <div className="bg-white rounded-3xl border border-slate-300/80 shadow-md p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h3 className="font-extrabold text-sm uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-[#008069]" />
              <span>Log Riwayat Petugas ({complaint.updates.length + 1} Catatan)</span>
            </h3>
            <span className="text-[11px] text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono font-semibold">
              Wajib Bukti Berkas
            </span>
          </div>

          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
            {/* Step 0: Registration */}
            <div className="relative space-y-1.5">
              <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#008069] flex items-center justify-center text-white text-[10px] font-bold shadow-xs">
                ✓
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">Laporan Resmi Berhasil Diterbitkan</span>
                <StatusBadge status="NEW" size="sm" />
              </div>
              <span className="text-[11px] text-slate-400 font-mono block">
                {formatDateTime(complaint.createdAt)}
              </span>
            </div>

            {/* Subsequent status updates */}
            {complaint.updates.map((upd, idx) => (
              <div key={upd.id || idx} className="relative space-y-2">
                <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-[#075e54] flex items-center justify-center text-white text-[10px] font-bold shadow-xs">
                  ✓
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <StatusBadge status={upd.status} size="sm" />
                  <span className="text-[11px] text-slate-400 font-mono">
                    {formatDateTime(upd.createdAt)}
                  </span>
                </div>

                {upd.note && (
                  <p className="text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 leading-relaxed font-medium">
                    {upd.note}
                  </p>
                )}

                {upd.status === "REJECTED" && upd.rejectionReason && (
                  <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
                    <span className="font-bold block text-rose-950">Alasan Resmi Penolakan:</span>
                    <p className="leading-relaxed">{upd.rejectionReason}</p>
                  </div>
                )}

                {/* Evidence Attachments */}
                {upd.evidence && upd.evidence.length > 0 && (
                  <div className="pt-1 space-y-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-mono font-bold block">
                      Bukti Foto / Berkas Pengerjaan Lapangan:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {upd.evidence.map((ev) => (
                        <button
                          key={ev.id}
                          onClick={() => setActiveEvidenceModal(ev.fileName)}
                          className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-xs font-mono text-[#075e54] font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
                        >
                          <Paperclip className="w-3.5 h-3.5 text-[#008069]" />
                          <span>{ev.fileName}</span>
                          <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Evidence Lightbox Modal */}
        {activeEvidenceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-[#008069]">
                  <FileText className="w-5 h-5" />
                  <h4 className="font-extrabold text-sm text-slate-900">
                    Pratinjau Dokumen Bukti Lapangan
                  </h4>
                </div>
                <button
                  onClick={() => setActiveEvidenceModal(null)}
                  className="text-xs text-slate-400 hover:text-slate-700 font-bold px-2 py-1 rounded"
                >
                  Tutup [×]
                </button>
              </div>

              <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200 space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-[#008069] flex items-center justify-center mx-auto shadow-inner">
                  <FileCheck2 className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="font-mono font-bold text-sm text-slate-900">
                    {activeEvidenceModal}
                  </p>
                  <p className="text-xs text-slate-500">
                    Berkas resmi terverifikasi dari repositori dinas lapangan.
                  </p>
                </div>
                <div className="pt-2">
                  <span className="text-[11px] bg-emerald-50 text-emerald-800 px-3 py-1 rounded-full border border-emerald-200 font-bold">
                    ✓ Validitas Terkonfirmasi Server
                  </span>
                </div>
              </div>

              <button
                onClick={() => setActiveEvidenceModal(null)}
                className="w-full py-2.5 rounded-xl bg-[#008069] text-white text-xs font-bold hover:bg-[#075e54] transition-colors cursor-pointer"
              >
                Tutup Pratinjau
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function LacakDetailPage({ params }: { params: Promise<{ ticket: string }> }) {
  return (
    <PublicLayout>
      <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Memuat rincian tiket...</div>}>
        <LacakDetailContent params={params} />
      </Suspense>
    </PublicLayout>
  );
}
