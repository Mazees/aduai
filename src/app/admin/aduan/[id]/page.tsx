"use client";

import React, { useState, use, Suspense } from "react";
import Link from "next/link";
import AdminLayout from "@/components/AdminLayout";
import { MockService, INITIAL_COMPLAINTS } from "@/lib/mock-service";
import { Complaint, ComplaintStatus, ALLOWED_STATUS_TRANSITIONS } from "@/types/complaint";
import StatusBadge from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/utils";
import { useIsMounted } from "@/lib/use-is-mounted";
import {
  ArrowLeft,
  ShieldAlert,
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Paperclip,
  Trash2,
  MessageSquare,
  Send,
  FileCheck2,
} from "lucide-react";

interface DetailContentProps {
  params: Promise<{ id: string }>;
}

function AdminAduanDetailContent({ params }: DetailContentProps) {
  const resolvedParams = use(params);
  const complaintId = resolvedParams.id;
  const isMounted = useIsMounted();

  const [clientComplaint, setClientComplaint] = useState<Complaint | null>(null);
  const initialComplaint = INITIAL_COMPLAINTS.find((c) => c.id === complaintId) || null;
  const complaint = clientComplaint ?? (isMounted ? (MockService.getComplaintById(complaintId) || null) : initialComplaint);
  const [selectedStatus, setSelectedStatus] = useState<ComplaintStatus | "">("");
  const [note, setNote] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; type: string; size: number }[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeEvidencePreview, setActiveEvidencePreview] = useState<string | null>(null);

  if (!complaint) {
    return (
      <AdminLayout>
        <div className="p-8 text-center space-y-4">
          <p className="text-sm text-slate-500">Laporan aduan tidak ditemukan atau telah diarsipkan.</p>
          <Link
            href="/admin/aduan"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#008069] text-white text-xs font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Daftar Aduan</span>
          </Link>
        </div>
      </AdminLayout>
    );
  }

  const allowedNextStatuses = ALLOWED_STATUS_TRANSITIONS[complaint.status] || [];

  const handleSimulateAddFile = (fileName: string, type: string) => {
    setUploadedFiles((prev) => [
      ...prev,
      {
        name: fileName,
        type,
        size: Math.floor(150000 + Math.random() * 800000),
      },
    ]);
  };

  const handleRemoveFile = (index: number) => {
    setUploadedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleStatusUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSuccessMsg(null);

    if (!selectedStatus) {
      setFormError("Pilih status tujuan pembaruan.");
      return;
    }

    if (uploadedFiles.length === 0) {
      setFormError("Wajib melampirkan minimal 1 bukti foto/dokumen resmi lapangan.");
      return;
    }

    if (selectedStatus === "REJECTED" && (!rejectionReason || !rejectionReason.trim())) {
      setFormError("Status REJECTED wajib menyertakan alasan penolakan yang rinci.");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const res = MockService.updateComplaintStatus(
        complaint.id,
        selectedStatus as ComplaintStatus,
        note,
        rejectionReason,
        uploadedFiles
      );

      if (res.success && res.complaint) {
        setClientComplaint(res.complaint);
        setSelectedStatus("");
        setNote("");
        setRejectionReason("");
        setUploadedFiles([]);
        setSuccessMsg(
          `Status berhasil diperbarui menjadi ${res.complaint.status}. Notifikasi otomatis WhatsApp telah dikirimkan ke pengadu.`
        );
      } else {
        setFormError(res.error || "Gagal memperbarui status.");
      }
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-5xl">
        {/* Back navigation */}
        <div>
          <Link
            href="/admin/aduan"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#008069] hover:text-[#075e54] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Meja Kerja Aduan</span>
          </Link>
        </div>

        {/* Strict PRD Anonymization Guarantee Banner */}
        <div className="bg-slate-900 text-slate-200 rounded-xl p-3.5 border border-slate-800 flex items-center gap-2.5 text-xs">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            <strong>Mode Anonim:</strong> Nomor WhatsApp & identitas pelapor tidak ditampilkan sesuai PRD Pasal 8.5. Pembaruan dikirim via background gateway.
          </span>
        </div>

        {/* Complaint Header Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-mono text-[#008069] uppercase tracking-wider block">
                {complaint.category}
              </span>
              <h1 className="text-xl sm:text-2xl font-bold font-mono text-slate-900 tracking-tight mt-0.5">
                {complaint.ticketNumber}
              </h1>
            </div>

            <div className="flex items-center gap-2">
              <StatusBadge status={complaint.status} size="md" />
            </div>
          </div>

          <div className="text-xs text-slate-400 font-mono">
            Masuk: {formatDateTime(complaint.createdAt)}
          </div>

          {/* AI Summary */}
          <div className="space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Intisari Laporan AI
            </span>
            <p className="text-sm font-semibold text-slate-900 leading-relaxed">
              {complaint.aiSummary}
            </p>
          </div>

          {/* Description */}
          <div>
            <span className="text-[11px] text-slate-400 block mb-1">
              Uraian Aduan
            </span>
            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-lg border border-slate-100 leading-relaxed">
              {complaint.description}
            </p>
          </div>
        </div>

        {/* Status Transition Action Form */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5">
          <div className="pb-3 border-b border-slate-100">
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
              Pembaruan Status & Bukti Lapangan
            </h3>
            <p className="text-xs text-slate-500">
              Setiap pergantian status wajib melampirkan minimal satu bukti berkas kerja (foto/PDF).
            </p>
          </div>

          {successMsg && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {formError && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {allowedNextStatuses.length === 0 ? (
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 text-center space-y-1">
              <p className="font-semibold text-slate-800">
                Laporan ini telah mencapai status terminal ({complaint.status}).
              </p>
              <p className="text-slate-500">
                Berdasarkan aturan bisnis PRD, status {complaint.status} tidak dapat diubah lagi pada tahap MVP.
              </p>
            </div>
          ) : (
            <form onSubmit={handleStatusUpdate} className="space-y-5">
              {/* Target Status Selection */}
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                  Pilih Status Tujuan Baru <span className="text-rose-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {allowedNextStatuses.map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedStatus(st)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                        selectedStatus === st
                          ? "bg-[#008069] text-white border-[#008069] shadow-xs scale-102"
                          : "bg-white text-slate-700 border-slate-200 hover:border-emerald-300"
                      }`}
                    >
                      Pindah ke: {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Note for citizen */}
              <div>
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1.5">
                  Catatan Progres Dinas (Akan dikirim ke WhatsApp pengadu)
                </label>
                <textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Contoh: Petugas teknis telah diterjunkan ke lokasi untuk perbaikan jalan..."
                  className="w-full text-xs sm:text-sm p-3 rounded-xl border border-slate-200 focus:border-[#008069] focus:ring-1 focus:ring-[#008069] outline-none"
                />
              </div>

              {/* Rejection reason (mandatory if REJECTED) */}
              {selectedStatus === "REJECTED" && (
                <div className="p-4 rounded-2xl bg-rose-50/70 border border-rose-200 space-y-2">
                  <label className="text-xs font-bold text-rose-900 uppercase tracking-wider block">
                    Alasan Penolakan Resmi <span className="text-rose-600">* (Wajib)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Sebutkan dasar pertimbangan penolakan (misal: sengketa perdata pribadi, bukan wewenang kota)..."
                    className="w-full text-xs sm:text-sm p-3 rounded-xl border border-rose-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none bg-white text-slate-800"
                  />
                </div>
              )}

              {/* Upload Proof Files (Mandatory) */}
              <div className="space-y-3">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                  Unggah Bukti Lapangan / Berkas Disposisi <span className="text-rose-500">* (Wajib minimal 1)</span>
                </label>

                {/* Upload Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleSimulateAddFile(
                        `foto_lapangan_${Date.now().toString().slice(-4)}.jpg`,
                        "image/jpeg"
                      )
                    }
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-[#008069] border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <UploadCloud className="w-4 h-4 text-[#008069]" />
                    <span>+ Tambah Foto Lapangan (JPG)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleSimulateAddFile(
                        `surat_tugas_resmi_${Date.now().toString().slice(-4)}.pdf`,
                        "application/pdf"
                      )
                    }
                    className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-[#008069] border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <FileText className="w-4 h-4 text-emerald-700" />
                    <span>+ Tambah Dokumen / PDF</span>
                  </button>
                </div>

                {/* Uploaded File List */}
                {uploadedFiles.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {uploadedFiles.map((file, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/60 border border-emerald-200 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-3.5 h-3.5 text-[#008069]" />
                          <span className="font-mono font-medium text-slate-800">
                            {file.name}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            ({Math.round(file.size / 1024)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(idx)}
                          className="text-rose-500 hover:text-rose-700 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#008069] hover:bg-[#075e54] text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {isSubmitting
                      ? "Menyimpan & Mengirim Notifikasi..."
                      : "Simpan Status & Kirim Notifikasi WhatsApp"}
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Previous Updates Timeline */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-4">
          <h3 className="font-bold text-xs uppercase tracking-wider text-slate-900">
            Riwayat Penanganan Sebelumnya ({complaint.updates.length})
          </h3>

          {complaint.updates.length === 0 ? (
            <p className="text-xs text-slate-500 py-2">
              Belum ada riwayat perubahan status dari petugas dinas.
            </p>
          ) : (
            <div className="space-y-4 divide-y divide-slate-100">
              {complaint.updates.map((upd, idx) => (
                <div key={idx} className="pt-3 first:pt-0 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={upd.status} size="sm" />
                      {upd.notificationStatus === "SENT" && (
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1">
                          <MessageSquare className="w-3 h-3 text-[#25d366]" />
                          WhatsApp Terkirim
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {formatDateTime(upd.createdAt)}
                    </span>
                  </div>

                  {upd.note && (
                    <p className="text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed">
                      {upd.note}
                    </p>
                  )}

                  {upd.status === "REJECTED" && upd.rejectionReason && (
                    <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 space-y-1">
                      <span className="font-bold block text-rose-900 uppercase tracking-wide">
                        Alasan Penolakan:
                      </span>
                      <p>{upd.rejectionReason}</p>
                    </div>
                  )}

                  {upd.evidence && upd.evidence.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {upd.evidence.map((ev) => (
                        <button
                          key={ev.id}
                          type="button"
                          onClick={() => setActiveEvidencePreview(ev.fileName)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-50 text-[#008069] border border-emerald-200 text-xs font-semibold hover:bg-emerald-100/70"
                        >
                          <Paperclip className="w-3 h-3" />
                          <span>{ev.fileName}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Simulated Evidence Modal */}
      {activeEvidencePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h4 className="font-bold text-sm text-slate-900">
                Pratinjau Dokumen Bukti Lapangan
              </h4>
              <button
                onClick={() => setActiveEvidencePreview(null)}
                className="text-xs text-slate-400 hover:text-slate-700 font-bold"
              >
                [X]
              </button>
            </div>
            <div className="bg-slate-50 rounded-2xl p-6 text-center border border-slate-200 space-y-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-[#008069] flex items-center justify-center mx-auto">
                <FileCheck2 className="w-6 h-6" />
              </div>
              <p className="font-mono font-bold text-xs text-slate-900">
                {activeEvidencePreview}
              </p>
              <p className="text-[11px] text-slate-500">
                Tersimpan di secure private bucket server dinas.
              </p>
            </div>
            <button
              onClick={() => setActiveEvidencePreview(null)}
              className="w-full py-2 rounded-xl bg-[#008069] text-white text-xs font-semibold"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

export default function AdminAduanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Memuat detail aduan...</div>}>
      <AdminAduanDetailContent params={params} />
    </Suspense>
  );
}
