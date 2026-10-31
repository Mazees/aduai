"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, AlertCircle } from "lucide-react";
import { MockService } from "@/lib/mock-service";
import PublicLayout from "@/components/PublicLayout";

export default function LacakPage() {
  const router = useRouter();
  const [ticketNumber, setTicketNumber] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!ticketNumber.trim()) {
      setErrorMsg("Nomor tiket wajib diisi.");
      return;
    }
    if (!MockService.getComplaintByTicket(ticketNumber)) {
      setErrorMsg("Nomor tiket tidak ditemukan.");
      return;
    }

    router.push(
      `/laporan/lacak/${encodeURIComponent(ticketNumber.trim().toUpperCase())}`,
    );
  };

  return (
    <PublicLayout>
      <div className="tracking-page">
        <div className="tracking-header"><h1>Lacak status aduan</h1></div>
        <div className="tracking-body">
          <div className="tracking-card">
            <h2>Temukan laporan Anda</h2>
            <p>Masukkan nomor tiket yang Anda dapat setelah aduan dikirim.</p>

            {/* Form Body */}
            <div className="tracking-card-content">
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
                    onChange={(e) =>
                      setTicketNumber(e.target.value.toUpperCase())
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 focus:border-primary focus:ring-1 focus:ring-primary/30 font-mono text-xs uppercase text-slate-900 outline-none transition-all"
                  />
                </div>

                <button
                  type="submit"
                  className="tracking-submit"
                >
                  <Search className="w-4 h-4" />
                  <span>Lacak laporan</span>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
