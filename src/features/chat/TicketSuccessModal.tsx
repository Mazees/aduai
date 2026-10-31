"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Check, Copy, ArrowRight, ShieldCheck } from "lucide-react";
import { Complaint } from "@/types/complaint";

interface TicketSuccessModalProps {
  complaint: Complaint;
  onClose?: () => void;
}

export default function TicketSuccessModal({ complaint }: TicketSuccessModalProps) {
  const [copiedTicket, setCopiedTicket] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyTicket = () => {
    navigator.clipboard.writeText(complaint.ticketNumber);
    setCopiedTicket(true);
    setTimeout(() => setCopiedTicket(false), 2000);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(complaint.accessCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#008069]">
            Tiket Terbit
          </span>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Laporan Anda Resmi Terdaftar
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Simpan nomor tiket dan kode akses berikut untuk memeriksa perkembangan aduan tanpa akun.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">
          {/* Ticket Number Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Nomor Tiket
              </span>
              <span className="font-mono font-bold text-base text-slate-900">
                {complaint.ticketNumber}
              </span>
            </div>
            <button
              onClick={handleCopyTicket}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-medium flex items-center gap-1 transition-colors"
            >
              {copiedTicket ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{copiedTicket ? "Tersalin" : "Salin"}</span>
            </button>
          </div>

          {/* Access Code Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Kode Akses Privat
              </span>
              <span className="font-mono font-bold text-base text-slate-900 tracking-wider">
                {complaint.accessCode}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-medium flex items-center gap-1 transition-colors"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="text-[11px]">{copiedCode ? "Tersalin" : "Salin"}</span>
            </button>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-2 p-2.5 rounded-lg bg-slate-50 border border-slate-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Pembaruan status & bukti kerja akan dikirimkan otomatis ke nomor WhatsApp Anda.</span>
          </div>

          {/* Action buttons */}
          <div className="pt-2 space-y-2">
            <Link
              href={`/lacak/${complaint.ticketNumber}?code=${encodeURIComponent(complaint.accessCode)}`}
              className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs bg-[#008069] hover:bg-[#075e54] text-white flex items-center justify-center gap-1.5 shadow-2xs transition-all active:scale-[0.98]"
            >
              <span>Lacak Progres Tiket</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>

            <Link
              href="/"
              className="block text-center text-xs text-slate-400 hover:text-slate-700 py-1 transition-colors"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
