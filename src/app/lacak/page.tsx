"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, ArrowRight, AlertCircle, ShieldCheck } from "lucide-react";
import { MockService, INITIAL_COMPLAINTS } from "@/lib/mock-service";
import PublicLayout from "@/components/PublicLayout";
import StatusBadge from "@/components/StatusBadge";
import { useIsMounted } from "@/lib/use-is-mounted";

export default function LacakPage() {
  const router = useRouter();
  const isMounted = useIsMounted();
  const [ticketNumber, setTicketNumber] = useState("");
  const [accessCode, setAccessCode] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sampleComplaints = isMounted ? MockService.getComplaints() : INITIAL_COMPLAINTS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!ticketNumber.trim()) {
      setErrorMsg("Nomor tiket wajib diisi.");
      return;
    }
    if (!accessCode.trim()) {
      setErrorMsg("Kode akses 6-karakter wajib diisi.");
      return;
    }

    const verification = MockService.verifyTracking(ticketNumber, accessCode);
    if (!verification.success) {
      setErrorMsg(verification.error || "Nomor tiket atau kode akses tidak cocok.");
      return;
    }

    router.push(
      `/lacak/${encodeURIComponent(ticketNumber.trim().toUpperCase())}?code=${encodeURIComponent(
        accessCode.trim().toUpperCase()
      )}`
    );
  };

  const handleFillSample = (ticket: string, code: string) => {
    setTicketNumber(ticket);
    setAccessCode(code);
    setErrorMsg(null);
  };

  return (
    <PublicLayout>
      <div className="min-h-[calc(100vh-140px)] bg-[#f2f5f3] py-12 px-4 sm:px-6 flex items-center justify-center">
        <div className="max-w-md w-full space-y-6">
          {/* Card Container */}
          <div className="bg-white rounded-3xl border border-slate-300/80 shadow-md overflow-hidden">
            {/* Dark Forest Header */}
            <div className="bg-[#075e54] text-white p-6 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-emerald-300 font-bold uppercase tracking-wider">
                  Portal Warga Mandiri
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-200 bg-white/10 px-2 py-0.5 rounded">
                  <ShieldCheck className="w-3 h-3 text-[#25d366]" />
                  Aman & Privat
                </span>
              </div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                Lacak Status Aduan
              </h1>
              <p className="text-xs text-emerald-100/90 leading-relaxed font-normal">
                Ketik nomor tiket dan kode akses 6-karakter yang Anda peroleh saat membuat laporan.
              </p>
            </div>

            {/* Form Body */}
            <div className="p-6 space-y-5">
              <form onSubmit={handleSubmit} className="space-y-4">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Nomor Tiket Aduan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: ADU-20261031-8921"
                    value={ticketNumber}
                    onChange={(e) => setTicketNumber(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#008069] focus:ring-1 focus:ring-[#008069]/30 font-mono text-xs uppercase text-slate-900 outline-none transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700">
                      Kode Akses Privat
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">6 Karakter Rahasia</span>
                  </div>
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Contoh: W8X9K2"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-[#008069] focus:ring-1 focus:ring-[#008069]/30 font-mono text-xs uppercase tracking-widest text-slate-900 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-xl font-extrabold text-xs bg-[#25d366] hover:bg-[#20ba59] text-[#075e54] flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Search className="w-4 h-4" />
                  <span>Buka Informasi & Riwayat Pengerjaan</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Quick Demo Autofill Chips */}
              <div className="pt-4 border-t border-slate-100 space-y-2.5">
                <span className="text-[11px] text-slate-500 font-bold block">
                  💡 Uji Coba Cepat (Data Demo):
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sampleComplaints.slice(0, 4).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleFillSample(item.ticketNumber, item.accessCode)}
                      className="p-2.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 bg-slate-50 text-left transition-colors text-xs space-y-1 cursor-pointer"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-[#008069] text-[11px]">
                          {item.ticketNumber}
                        </span>
                        <StatusBadge status={item.status} size="sm" />
                      </div>
                      <p className="text-[10px] text-slate-500 truncate font-mono">
                        Kode: {item.accessCode}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
