"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ArrowRight, MessageSquarePlus, Search, Lock } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Beranda" },
    { href: "/aduan/buat", label: "Buat Aduan" },
    { href: "/lacak", label: "Lacak Tiket" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#075e54] text-white border-b border-[#054840] shadow-sm transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-15">
          {/* Logo Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-xl bg-[#25d366] text-[#075e54] flex items-center justify-center font-black text-sm tracking-tight shadow-sm group-hover:scale-105 transition-transform">
              A
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white leading-tight">
                  AduAI
                </span>
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-[10px] font-medium text-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#25d366] animate-pulse" />
                  Live 24 Jam
                </span>
              </div>
              <span className="text-[11px] text-emerald-100/80 font-normal leading-none hidden sm:inline">
                Aduan Warga Berbasis WhatsApp AI
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-5 text-sm">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg transition-all text-xs font-semibold ${
                    isActive
                      ? "bg-white/15 text-white shadow-2xs"
                      : "text-emerald-100/90 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="h-4 w-px bg-white/20" />

            {/* Portal Admin link */}
            <Link
              href="/admin/login"
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs text-emerald-200/90 hover:text-white hover:bg-white/10 font-medium transition-colors"
            >
              <Lock className="w-3.5 h-3.5 opacity-80" />
              <span>Petugas Dinas</span>
            </Link>

            {/* Primary Action Button */}
            <Link
              href="/aduan/buat"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#25d366] hover:bg-[#20ba59] text-[#075e54] text-xs font-bold shadow-md transition-all active:scale-[0.98]"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Lapor Sekarang</span>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-emerald-100 hover:text-white hover:bg-white/10 focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#064e45] border-t border-[#053d36] px-4 pt-3 pb-5 space-y-2.5 shadow-xl animate-in slide-in-from-top-2 duration-150">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className={`block px-3.5 py-2 rounded-xl text-xs font-semibold ${
              pathname === "/" ? "bg-white/20 text-white" : "text-emerald-100"
            }`}
          >
            Beranda
          </Link>
          <Link
            href="/aduan/buat"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold bg-[#25d366] text-[#075e54] shadow-sm"
          >
            <span className="flex items-center gap-2">
              <MessageSquarePlus className="w-4 h-4" />
              <span>Mulai Buat Aduan Baru</span>
            </span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/lacak"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold ${
              pathname === "/lacak" ? "bg-white/20 text-white" : "text-emerald-100"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            <span>Lacak Status Tiket</span>
          </Link>
          <div className="pt-2 border-t border-white/10">
            <Link
              href="/admin/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs text-emerald-200 hover:text-white"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Portal Petugas Dinas</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
