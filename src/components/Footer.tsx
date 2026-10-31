import React from "react";
import Link from "next/link";
import { ShieldCheck, MessageSquare, Search, Lock } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-[#075e54]/30 bg-[#0b141a] text-slate-400 py-10 px-4 sm:px-6 text-xs">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-[#25d366] text-[#075e54] flex items-center justify-center font-black text-xs">
                A
              </div>
              <span className="font-extrabold text-sm tracking-tight text-white">
                AduAI
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-300 font-medium text-xs">
                Kanal Layanan Pengaduan Warga Berbasis WhatsApp AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 max-w-lg leading-relaxed">
              Platform independen pelaporan infrastruktur publik. Mengubah cerita percakapan santai menjadi dokumen tiket kerja resmi dinas dengan perlindungan privasi nomor kontak.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
            <Link
              href="/aduan/buat"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/30 text-emerald-300 hover:text-white hover:bg-emerald-900/60 transition-colors"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Buat Aduan Baru</span>
            </Link>
            <Link
              href="/lacak"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Lacak Tiket & Kode Akses</span>
            </Link>
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-400 hover:text-slate-200 transition-colors"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Portal Petugas</span>
            </Link>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-[#25d366]" />
            <span>Kerahasiaan Terjaga • Hash 6 Karakter • Data Lapangan Otentik</span>
          </div>
          <p>© 2026 AduAI Civics Engine. Dibuat untuk pelayanan warga yang cepat dan transparan.</p>
        </div>
      </div>
    </footer>
  );
}
