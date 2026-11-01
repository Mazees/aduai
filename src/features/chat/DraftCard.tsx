"use client";

import React from "react";
import { ComplaintDraft } from "@/types/complaint";
import {
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileCheck2,
  Building2,
  Phone,
  MapPin,
} from "lucide-react";
import { normalizeWhatsApp } from "@/lib/utils";

interface DraftCardProps {
  draft: ComplaintDraft | null;
  onUpdateDraft: (updated: ComplaintDraft) => void;
  onConfirmSubmit: () => void;
  readyForConfirmation: boolean;
  missingFields: string[];
  isSubmitting?: boolean;
}

export default function DraftCard({
  draft,
  onUpdateDraft,
  onConfirmSubmit,
  readyForConfirmation,
  missingFields,
  isSubmitting = false,
}: DraftCardProps) {
  void missingFields;

  if (!draft) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 text-center space-y-4 shadow-sm">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-primary flex items-center justify-center mx-auto border border-emerald-100">
          <FileCheck2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-sm text-slate-900">
            Draf Tiket Belum Aktif
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed max-w-xs mx-auto">
            Mulai ceritakan keluhan Anda pada kolom chat di sebelah kiri.
            Asisten AI akan otomatis menyusun draf resmi dan memetakan dinas
            penanggung jawab di sini.
          </p>
        </div>
        <div className="pt-2 flex items-center justify-center gap-1.5 text-[11px] text-primary font-medium">
          <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
          <span>Menunggu percakapan awal Anda</span>
        </div>
      </div>
    );
  }

  const handlePhoneChange = (val: string) => {
    onUpdateDraft({
      ...draft,
      whatsapp: val,
    });
  };

  const handleBlurPhone = () => {
    if (draft.whatsapp) {
      onUpdateDraft({
        ...draft,
        whatsapp: normalizeWhatsApp(draft.whatsapp),
      });
    }
  };

  const isPhoneValid =
    draft.whatsapp && draft.whatsapp.replace(/[^0-9]/g, "").length >= 9;
  const isDescValid = draft.description && draft.description.trim().length >= 8;
  const isCategoryValid = !!draft.category;

  // Calculate completion percentage
  let score = 0;
  if (isCategoryValid) score += 33;
  if (isDescValid) score += 33;
  if (isPhoneValid) score += 34;

  const canSubmit =
    (readyForConfirmation || (isPhoneValid && isDescValid)) && !isSubmitting;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-md overflow-hidden flex flex-col">
      {/* Header with Progress Bar */}
      <div className="bg-primary text-white p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-secondary text-white flex items-center justify-center font-black text-xs">
              ADU
            </div>
            <h3 className="font-extrabold text-xs uppercase tracking-wider text-white">
              Draf Aduan Dinas
            </h3>
          </div>
          <span className="text-[10px] font-mono text-emerald-200 bg-white/10 px-2 py-0.5 rounded border border-white/15">
            {score}% Lengkap
          </span>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full h-1.5 rounded-full bg-white/20 overflow-hidden">
          <div
            className="h-full bg-secondary transition-all duration-300 rounded-full"
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4 text-xs flex-1">
        {/* Verification Checklist */}
        <div className="grid grid-cols-3 gap-2 pb-3 border-b border-slate-100 text-[10px]">
          <div className="flex items-center gap-1">
            <CheckCircle2
              className={`w-3.5 h-3.5 shrink-0 ${isCategoryValid ? "text-primary" : "text-slate-300"}`}
            />
            <span
              className={
                isCategoryValid
                  ? "font-semibold text-slate-800"
                  : "text-slate-400"
              }
            >
              Kategori
            </span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2
              className={`w-3.5 h-3.5 shrink-0 ${isDescValid ? "text-primary" : "text-slate-300"}`}
            />
            <span
              className={
                isDescValid ? "font-semibold text-slate-800" : "text-slate-400"
              }
            >
              Uraian
            </span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2
              className={`w-3.5 h-3.5 shrink-0 ${isPhoneValid ? "text-primary" : "text-slate-300"}`}
            />
            <span
              className={
                isPhoneValid ? "font-semibold text-slate-800" : "text-slate-400"
              }
            >
              WhatsApp
            </span>
          </div>
        </div>

        {/* Dinas / Kategori */}
        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span>Disposisi Satuan Kerja Terkait</span>
          </label>
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs">
            <span className="font-bold text-primary">
              {draft.category || "Dinas Terkait (Menganalisis...)"}
            </span>
            <span className="text-[10px] text-emerald-800 bg-white px-2 py-0.5 rounded font-mono border border-emerald-200">
              Otomatis AI
            </span>
          </div>
        </div>

        {/* Intisari Aduan */}
        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1">
            Ringkasan Eksekutif
          </label>
          <p className="text-slate-800 bg-slate-50 p-3 rounded-xl border border-slate-200/80 leading-relaxed font-medium">
            {draft.aiSummary || draft.description}
          </p>
        </div>

        {/* Uraian Lengkap & Lokasi (Editable) */}
        <div>
          <label className="text-[11px] font-bold text-slate-600 block mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-primary" />
              <span>Detail Kejadian & Lokasi</span>
            </span>
            <span className="text-[10px] text-slate-400 font-normal">
              Dapat diedit
            </span>
          </label>
          <textarea
            rows={3}
            value={draft.description}
            onChange={(e) =>
              onUpdateDraft({ ...draft, description: e.target.value })
            }
            placeholder="Jelaskan kondisi fisik, jalan, RT/RW, dan patokan terdekat..."
            className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none resize-none bg-white text-slate-800 leading-relaxed"
          />
        </div>

        {/* Nomor WhatsApp */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-primary" />
              <span>
                Nomor WhatsApp Pelapor <span className="text-rose-500">*</span>
              </span>
            </label>
            <span className="text-[10px] text-slate-400 font-mono">
              Format: 08xx / +62
            </span>
          </div>
          <input
            type="tel"
            value={draft.whatsapp}
            onChange={(e) => handlePhoneChange(e.target.value)}
            onBlur={handleBlurPhone}
            placeholder="081234567890"
            className={`w-full text-xs px-3.5 py-2.5 rounded-xl border font-mono outline-none transition-colors ${
              isPhoneValid
                ? "border-emerald-300 bg-emerald-50/30 focus:border-primary"
                : "border-slate-200 focus:border-primary"
            }`}
          />
          <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 text-[10px] text-slate-500 flex items-start gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
            <span>
              Nomor Anda 100% dienkripsi dan hanya dipakai untuk mengirimkan
              nomor tiket & notifikasi foto selesai via WhatsApp.
            </span>
          </div>
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-200">
        <button
          onClick={onConfirmSubmit}
          disabled={!canSubmit}
          className={`w-full py-3 px-4 rounded-xl font-extrabold text-xs flex items-center justify-center gap-2 transition-all ${
            canSubmit
              ? "bg-primary hover:bg-dark text-white shadow-md active:scale-98 cursor-pointer ring-2 ring-secondary/40"
              : "bg-slate-200 text-slate-400 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? (
            <span>Menerbitkan Tiket Resmi...</span>
          ) : (
            <>
              <span>Konfirmasi & Terbitkan Tiket Resmi</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
