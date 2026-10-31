"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Search,
  ShieldCheck,
  CheckCheck,
  Paperclip,
  MapPin,
  MessageSquare,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Shield,
  Zap,
} from "lucide-react";
import { MockService, INITIAL_COMPLAINTS } from "@/lib/mock-service";
import PublicLayout from "@/components/PublicLayout";
import StatusBadge from "@/components/StatusBadge";
import { useIsMounted } from "@/lib/use-is-mounted";

// Interactive showcase scenarios for the hero
const SHOWCASE_SCENARIOS = [
  {
    id: "jalan-rusak",
    label: "🚧 Jalan Berlubang",
    location: "Depan SDN 01 Rawamangun, Pulo Gadung",
    department: "Dinas Bina Marga",
    userMessage: "Selamat pagi min, ada jalan berlubang cukup parah di depan SDN 01 Rawamangun. Tadi pagi ada pemotor hampir jatuh pas hindarin lubang. Tolong segera ditambal ya.",
    assistantReply: "Terima kasih informasinya. Saya segera catat laporannya untuk Dinas Bina Marga. Tim kami butuh foto kondisi lubang dan patokan jalan terdekat agar petugas penambal bisa langsung ke lokasi.",
    ticketNumber: "ADU-20261031-8921",
    accessCode: "W8X9K2",
    status: "IN_PROGRESS" as const,
    statusText: "Dalam Pengerjaan",
    evidenceFile: "bukti_survey_tambal_jalan.jpg",
    actionNote: "Tim Unit Reaksi Cepat (URC) Bina Marga sudah menurunkan alat aspal dingin (coldmix) ke lokasi SDN 01.",
  },
  {
    id: "lampu-pju",
    label: "💡 Lampu PJU Mati",
    location: "Jl. Merpati RT 03/RW 05, Pesanggrahan",
    department: "Dinas Bina Marga & PJU",
    userMessage: "Lampu penerangan jalan umum di Jl. Merpati mati total sepanjang kurang lebih 300 meter sudah 5 hari min, gelap sekali kalau malam rawan begal.",
    assistantReply: "Kami mengerti kekhawatiran Anda mengenai keamanan warga. Laporan PJU padam telah direkapitulasi dan diteruskan ke posko teknisi PJU wilayah Jaksel.",
    ticketNumber: "ADU-20261030-4102",
    accessCode: "P4M2L8",
    status: "ACCEPTED" as const,
    statusText: "Diverifikasi Dinas",
    evidenceFile: "tiket_disposisi_teknisi_pju.pdf",
    actionNote: "Jadwal penggantian ballast dan modul lampu LED telah diagendakan pada giliran shift malam ini.",
  },
  {
    id: "sampah-liar",
    label: "🗑️ Tumpukan Sampah",
    location: "Kolong Jembatan Pasar Minggu",
    department: "Dinas Lingkungan Hidup",
    userMessage: "Sampah liar menumpuk di kolong jembatan pasar minggu, baunya menyengat dan lalat banyak masuk ke warung warga di sampingnya.",
    assistantReply: "Keluhan bau dan kebersihan ini sudah kami prioritaskan untuk Dinas Lingkungan Hidup. Draf tiket telah diterbitkan dengan kode akses rahasia Anda.",
    ticketNumber: "ADU-20261028-1109",
    accessCode: "K3L9M1",
    status: "RESOLVED" as const,
    statusText: "Selesai Berbukti",
    evidenceFile: "foto_truk_kebersihan_bersih.jpg",
    actionNote: "Armada truk typer DLH telah mengangkut 4 ton tumpukan sampah dan area kolong telah disemprot disinfektan.",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [activeScenario, setActiveScenario] = useState(0);
  const [quickTicket, setQuickTicket] = useState("");
  const [quickCode, setQuickCode] = useState("");
  const [trackError, setTrackError] = useState<string | null>(null);

  const isMounted = useIsMounted();
  const sampleComplaints = (isMounted ? MockService.getComplaints() : INITIAL_COMPLAINTS).slice(0, 4);
  const currentScenario = SHOWCASE_SCENARIOS[activeScenario];

  const handleQuickTrack = (e: React.FormEvent) => {
    e.preventDefault();
    setTrackError(null);
    if (!quickTicket.trim() || !quickCode.trim()) {
      setTrackError("Harap masukkan Nomor Tiket dan Kode Akses 6 karakter.");
      return;
    }
    const res = MockService.verifyTracking(quickTicket, quickCode);
    if (!res.success) {
      setTrackError(res.error || "Nomor tiket atau kode akses tidak cocok.");
      return;
    }
    router.push(
      `/lacak/${encodeURIComponent(quickTicket.trim().toUpperCase())}?code=${encodeURIComponent(
        quickCode.trim().toUpperCase()
      )}`
    );
  };

  const handleApplyQuickTest = (ticketNum: string, code: string) => {
    setQuickTicket(ticketNum);
    setQuickCode(code);
    setTrackError(null);
  };

  return (
    <PublicLayout>
      <div className="text-slate-900">
        {/* TOP HERO SECTION */}
        <section className="relative overflow-hidden pt-12 pb-16 px-4 sm:px-6">
          {/* Subtle civic pattern background */}
          <div className="absolute inset-0 -z-10 bg-gradient-to-b from-[#075e54]/10 via-[#f2f5f3] to-[#f2f5f3]" />
          
          <div className="max-w-5xl mx-auto text-center space-y-6">
            {/* Live Trust Banner */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white border border-emerald-200 shadow-xs text-xs font-semibold text-[#075e54]">
              <span className="w-2 h-2 rounded-full bg-[#25d366] animate-pulse" />
              <span>Kanal Resmi Pengaduan Fasilitas Kota Berbasis WhatsApp AI</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-normal">Bebas Formulir Rumit</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-slate-950 leading-[1.12]">
              Aduan Fasilitas Publik, <br />
              <span className="text-[#008069] inline-block relative">
                Semudah Chat WhatsApp.
                <span className="absolute bottom-1 left-0 right-0 h-2 bg-[#25d366]/25 -z-1 rounded" />
              </span>
            </h1>

            {/* Subhead */}
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
              Jalan berlubang, lampu jalan padam, atau tumpukan sampah? Cukup ceritakan kronologi seperti biasa. Asisten AI merangkum lokasi, menugaskan ke dinas terkait, dan memantau bukti foto pengerjaan hingga tuntas.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-2">
              <Link
                href="/aduan/buat"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#25d366] hover:bg-[#20ba59] text-[#075e54] text-sm font-extrabold transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Mulai Buat Aduan Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </Link>

              <Link
                href="/lacak"
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-800 text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-xs"
              >
                <Search className="w-4 h-4 text-[#008069]" />
                <span>Lacak Status Tiket Anda</span>
              </Link>
            </div>

            {/* Metric pill bar */}
            <div className="flex items-center justify-center gap-4 text-xs text-slate-500 pt-3">
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-[#008069]" />
                <span>100% Anonim</span>
              </span>
              <span className="text-slate-300">•</span>
              <span className="flex items-center gap-1.5 font-medium text-slate-700">
                <ShieldCheck className="w-4 h-4 text-[#008069]" />
                <span>Kode Akses 6 Karakter</span>
              </span>
              <span className="text-slate-300 hidden sm:inline">•</span>
              <span className="hidden sm:flex items-center gap-1.5 font-medium text-slate-700">
                <FileCheck2 className="w-4 h-4 text-[#008069]" />
                <span>Wajib Bukti Pengerjaan</span>
              </span>
            </div>
          </div>
        </section>

        {/* INTERACTIVE LIVE DEMO SHOWCASE (TRANSFORMING CHAT TO CIVIC TICKET) */}
        <section className="px-4 sm:px-6 max-w-5xl mx-auto pb-16">
          <div className="bg-white rounded-3xl border border-slate-300/80 shadow-md overflow-hidden">
            {/* Top Bar with Scenario Switcher */}
            <div className="bg-[#075e54] text-white p-4 sm:px-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-mono text-emerald-300 uppercase tracking-wider font-semibold">
                  Demo Interaktif Langsung
                </span>
                <h3 className="text-sm font-bold text-white">
                  Klik skenario di bawah untuk melihat bagaimana AI menyusun tiket dinas:
                </h3>
              </div>

              {/* Scenario chips */}
              <div className="flex flex-wrap items-center gap-1.5">
                {SHOWCASE_SCENARIOS.map((sc, i) => (
                  <button
                    key={sc.id}
                    onClick={() => setActiveScenario(i)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      activeScenario === i
                        ? "bg-[#25d366] text-[#075e54] shadow-sm scale-102"
                        : "bg-white/10 text-emerald-100 hover:bg-white/20"
                    }`}
                  >
                    {sc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Split Screen Showcase: Left WhatsApp Chat, Right Official Civic Ticket */}
            <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
              {/* LEFT: WhatsApp Chat Preview */}
              <div className="lg:col-span-6 p-4 sm:p-6 bg-slate-50 flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  {/* Fake WhatsApp Chat Header */}
                  <div className="flex items-center justify-between bg-white px-3.5 py-2.5 rounded-xl border border-slate-200 shadow-2xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-[#008069] text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        AI
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 leading-tight">
                          Asisten AduAI
                        </h4>
                        <span className="text-[10px] text-emerald-700 flex items-center gap-1 font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#25d366]" />
                          Online • WhatsApp Web API
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Warga ➔ Sistem
                    </span>
                  </div>

                  {/* Chat message bubbles */}
                  <div className="wa-chat-bg p-4 rounded-2xl border border-slate-200/80 space-y-3 shadow-inner">
                    {/* User message bubble */}
                    <div className="flex justify-end">
                      <div className="bg-[#d9fdd3] text-slate-900 px-3.5 py-2.5 rounded-2xl rounded-tr-xs text-xs max-w-[90%] shadow-2xs border border-emerald-300/40 space-y-1">
                        <p className="leading-relaxed">{currentScenario.userMessage}</p>
                        <div className="flex items-center justify-end gap-1 text-[10px] text-emerald-800">
                          <span>08:14</span>
                          <CheckCheck className="w-3.5 h-3.5 text-[#34B7F1]" />
                        </div>
                      </div>
                    </div>

                    {/* AI message bubble */}
                    <div className="flex justify-start">
                      <div className="bg-white text-slate-900 px-3.5 py-2.5 rounded-2xl rounded-tl-xs text-xs max-w-[90%] shadow-2xs border border-slate-200 space-y-1.5">
                        <span className="text-[10px] font-bold text-[#008069] block">
                          Asisten AduAI
                        </span>
                        <p className="leading-relaxed text-slate-700">
                          {currentScenario.assistantReply}
                        </p>
                        <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>Tiket {currentScenario.ticketNumber}</span>
                          <span>08:15</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Direct CTA to try this scenario */}
                <div className="pt-2">
                  <Link
                    href={`/aduan/buat?initial=${encodeURIComponent(currentScenario.userMessage)}`}
                    className="w-full py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-300 text-[#075e54] text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    <span>Coba Skenario Ini di Chat AI Sekarang</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>

              {/* RIGHT: Resulting Official Civic Ticket */}
              <div className="lg:col-span-6 p-4 sm:p-6 bg-white space-y-4 flex flex-col justify-between">
                <div className="space-y-4">
                  {/* Ticket Header & Status */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-200">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
                        Dokumen Tiket Resmi Dinas
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 font-mono">
                        {currentScenario.ticketNumber}
                      </h4>
                    </div>
                    <StatusBadge status={currentScenario.status} />
                  </div>

                  {/* Metadata fields */}
                  <div className="space-y-2.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-700">
                      <MapPin className="w-4 h-4 text-[#008069] shrink-0" />
                      <span className="font-semibold text-slate-900">Lokasi:</span>
                      <span className="text-slate-600 truncate">{currentScenario.location}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <Shield className="w-4 h-4 text-[#008069] shrink-0" />
                      <span className="font-semibold text-slate-900">Disposisi:</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-[#075e54] font-semibold text-[11px] border border-emerald-200">
                        {currentScenario.department}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700">
                      <ShieldCheck className="w-4 h-4 text-[#008069] shrink-0" />
                      <span className="font-semibold text-slate-900">Kode Akses Privat:</span>
                      <span className="font-mono font-bold px-2 py-0.5 bg-slate-100 rounded border border-slate-200 text-slate-900">
                        {currentScenario.accessCode}
                      </span>
                      <span className="text-[10px] text-slate-400">(Khusus Pelapor)</span>
                    </div>
                  </div>

                  {/* Mandatory Field Inspector Note & Proof */}
                  <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                      <span className="flex items-center gap-1.5">
                        <FileCheck2 className="w-4 h-4 text-[#008069]" />
                        <span>Catatan Progres Lapangan</span>
                      </span>
                      <span className="text-[10px] text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded font-mono font-semibold">
                        Resmi Dinas
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed italic">
                      &quot;{currentScenario.actionNote}&quot;
                    </p>

                    <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-mono">Berkas Bukti:</span>
                      <span className="inline-flex items-center gap-1 font-mono font-bold text-[#008069]">
                        <Paperclip className="w-3 h-3" />
                        {currentScenario.evidenceFile}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Direct Link to Track */}
                <div className="pt-2">
                  <Link
                    href={`/lacak/${currentScenario.ticketNumber}?code=${currentScenario.accessCode}`}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#008069] hover:bg-[#075e54] text-white text-xs font-bold transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <span>Lihat Halaman Pelacakan Lengkap</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* INSTANT TICKET TRACKING COCKPIT */}
        <section className="py-14 px-4 sm:px-6 max-w-4xl mx-auto">
          <div className="bg-[#075e54] text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-[#054a42] space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[11px] font-mono text-emerald-300 uppercase tracking-wider font-bold">
                  Pelacakan Tiket Mandiri
                </span>
                <h3 className="text-xl font-extrabold text-white">
                  Sudah punya nomor tiket aduan?
                </h3>
                <p className="text-xs text-emerald-100/90">
                  Pantau langsung disposisi petugas, tindak lanjut, dan berkas foto pengerjaan.
                </p>
              </div>

              <div className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/10 text-xs text-emerald-100 flex items-center gap-2 self-start sm:self-auto">
                <Zap className="w-4 h-4 text-[#25d366]" />
                <span>Tanpa Perlu Login Akun</span>
              </div>
            </div>

            {trackError && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-400 text-rose-100 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-300 shrink-0" />
                <span>{trackError}</span>
              </div>
            )}

            {/* Tracking Form */}
            <form onSubmit={handleQuickTrack} className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="text"
                placeholder="Nomor Tiket (Contoh: ADU-20261031-8921)"
                value={quickTicket}
                onChange={(e) => setQuickTicket(e.target.value.toUpperCase())}
                className="flex-1 px-4 py-3 text-xs sm:text-sm font-mono tracking-wide rounded-xl bg-white text-slate-900 border border-transparent focus:border-[#25d366] focus:ring-2 focus:ring-[#25d366]/30 outline-none"
              />
              <input
                type="text"
                maxLength={6}
                placeholder="Kode Akses (6 Karakter)"
                value={quickCode}
                onChange={(e) => setQuickCode(e.target.value.toUpperCase())}
                className="w-full sm:w-52 px-4 py-3 text-xs sm:text-sm font-mono font-bold tracking-widest uppercase rounded-xl bg-white text-slate-900 border border-transparent focus:border-[#25d366] focus:ring-2 focus:ring-[#25d366]/30 outline-none"
              />
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-[#25d366] hover:bg-[#20ba59] text-[#075e54] text-xs sm:text-sm font-extrabold shadow-md transition-all active:scale-95 shrink-0 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>Lacak Sekarang</span>
              </button>
            </form>

            {/* 1-Click Interactive Test Chips */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <span className="text-[11px] text-emerald-200/90 font-medium block">
                💡 Klik chip di bawah untuk langsung menguji tiket demo yang ada:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {sampleComplaints.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleApplyQuickTest(c.ticketNumber, c.accessCode)}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-white font-mono text-[11px] transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span className="font-bold">{c.ticketNumber}</span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/60 text-[10px] text-emerald-300">
                      {c.status}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* 3 CORE WORKFLOW PILLARS (NO AI SLOP, HIGH-CRAFT CIVIC CARDS) */}
        <section className="py-14 px-4 sm:px-6 max-w-5xl mx-auto">
          <div className="text-center space-y-2 pb-8">
            <span className="text-xs font-mono font-semibold uppercase tracking-wider text-[#008069]">
              Alur Pengaduan Warga
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Tiga Langkah Mudah Hingga Perbaikan Selesai
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto">
              Didesain agar warga lansia hingga pemuda dapat melapor tanpa bingung kode wilayah atau birokrasi berbelit.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Pillar 1 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-3.5 shadow-sm hover:border-emerald-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-[#008069] flex items-center justify-center font-bold text-sm">
                01
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Ketik Santai Seperti Chat Teman
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ceritakan kerusakan jalan, got mampet, atau lampu padam apa adanya. Anda juga bisa menyertakan foto dan titik patokan terdekat.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-3.5 shadow-sm hover:border-emerald-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-[#008069] flex items-center justify-center font-bold text-sm">
                02
              </div>
              <h3 className="font-bold text-base text-slate-900">
                AI Susun Draf & Lindungi Privasi
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Asisten mengekstrak kategori dinas yang berwenang, merangkum kronologi, dan menghasilkan kode akses 6-karakter privat agar nomor Anda tetap aman.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-6 space-y-3.5 shadow-sm hover:border-emerald-300 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-[#008069] flex items-center justify-center font-bold text-sm">
                03
              </div>
              <h3 className="font-bold text-base text-slate-900">
                Petugas Wajib Unggah Bukti Nyata
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dinas tidak bisa sembarangan menutup tiket. Setiap pembaruan status wajib menyertakan foto perbaikan langsung dari lapangan.
              </p>
            </div>
          </div>
        </section>
      </div>
    </PublicLayout>
  );
}
