"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  BrainCircuit,
  Sliders,
  LogOut,
  ExternalLink,
  Menu,
  X,
  Shield,
  MessageSquare,
} from "lucide-react";
import { MockService } from "@/lib/mock-service";

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminLayoutInner({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const navItems = [
    { href: "/admin/dashboard", label: "Dashboard Ringkasan", icon: LayoutDashboard },
    { href: "/admin/aduan", label: "Daftar Laporan Aduan", icon: Inbox },
    { href: "/admin/pembelajaran", label: "Evaluasi & Persona AI", icon: BrainCircuit },
    { href: "/admin/pengaturan/ai", label: "Pengaturan Provider AI", icon: Sliders },
  ];

  const handleLogout = () => {
    MockService.logoutAdmin();
    router.push("/admin/login");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col md:flex-row">
      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#111b21] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#008069] flex items-center justify-center text-white">
            <Shield className="w-4 h-4" />
          </div>
          <span className="font-bold text-sm tracking-tight">AduAI Admin</span>
        </div>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
        >
          {sidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar for Desktop & Mobile Drawer */}
      <aside
        className={`fixed md:sticky top-0 z-40 h-screen w-64 bg-[#111b21] text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-200 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        {/* Brand header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <Link href="/admin/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#008069] text-white flex items-center justify-center shadow-xs">
              <Shield className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <span className="font-bold text-base text-white tracking-tight block">
                AduAI Admin
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">
                Portal Pengelola Dinas
              </span>
            </div>
          </Link>
          <button
            onClick={() => setSidebarOpen(false)}
            className="md:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-[#008069] text-white shadow-xs"
                    : "text-slate-400 hover:bg-[#202c33] hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#25d366]" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className="p-3 border-t border-slate-800 space-y-1">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-between px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:bg-[#202c33] hover:text-white transition-colors"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-500" />
              <span>Buka Portal Warga</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs text-rose-400 hover:bg-rose-950/40 hover:text-rose-300 transition-colors text-left"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar Sesi Admin</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {/* Top bar on desktop */}
        <div className="hidden md:flex items-center justify-between px-6 py-2.5 bg-white border-b border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#008069]" />
            <span className="font-medium text-slate-600">
              Sistem Operasional AduAI
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-500 font-mono text-[11px]">
            <span>Petugas Terautentikasi</span>
          </div>
        </div>

        <div className="p-4 sm:p-6 lg:p-8 flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-900 flex items-center justify-center text-xs text-slate-400">
          Memuat portal admin...
        </div>
      }
    >
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}
