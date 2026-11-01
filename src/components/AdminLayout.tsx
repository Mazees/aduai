"use client";

import React, { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Inbox,
  BookOpen,
  TrendingUp,
  Sliders,
  LogOut,
  ExternalLink,
  Menu,
  X,
  MessageSquare,
  MessageCircle,
} from "lucide-react";
import { adminFetch, clearAdminSession } from "@/lib/auth/admin-session";

interface AdminLayoutProps {
  children: React.ReactNode;
}

function AdminLayoutInner({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  useEffect(() => { void adminFetch('/api/admin/auth/me').catch(() => {}); }, []);
  const sidebar = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!sidebarOpen) return;
    sidebar.current?.querySelector<HTMLAnchorElement>("a")?.focus();
    const returnFocus = menuButton.current;
    return () => returnFocus?.focus();
  }, [sidebarOpen]);

  const navItems = [
    { href: "/admin/dashboard", label: "Ringkasan", icon: LayoutDashboard },
    { href: "/admin/aduan", label: "Daftar aduan", icon: Inbox },
    { href: "/admin/knowledge", label: "Pengetahuan AI", icon: BookOpen },
    { href: "/admin/pembelajaran", label: "Perkembangan AI", icon: TrendingUp },
    { href: "/admin/pengaturan/ai", label: "Pengaturan AI", icon: Sliders },
    { href: "/admin/pengaturan/whatsapp", label: "WhatsApp", icon: MessageCircle },
  ];

  const handleLogout = () => {
    clearAdminSession();
    router.push("/admin/login");
  };

  return (
    <div className="admin-shell">
      <a href="#admin-content" className="skip-link">Langsung ke isi halaman</a>
      {/* Mobile Top Header */}
      <header className="admin-mobile-toolbar">
        <button ref={menuButton} type="button" aria-label={sidebarOpen ? "Tutup menu admin" : "Buka menu admin"} aria-expanded={sidebarOpen} aria-controls="admin-navigation"
          onClick={() => setSidebarOpen(!sidebarOpen)} className="theme-toggle">
          {sidebarOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
        <Link href="/admin/dashboard" className="workspace-mobile-brand">
          <Image src="/icon.png" alt="" width={40} height={40} />
          <span><strong>AduAI</strong><small>Ruang admin</small></span>
        </Link>
      </header>

      {/* Sidebar for Desktop & Mobile Drawer */}
      <aside
        id="admin-navigation" ref={sidebar}
        className={`admin-sidebar ${sidebarOpen ? "is-open" : ""}`}
        role={sidebarOpen ? "dialog" : undefined} aria-modal={sidebarOpen ? true : undefined} aria-label="Menu admin"
        onKeyDown={(event) => {
          if (!sidebarOpen) return;
          if (event.key === "Escape") setSidebarOpen(false);
          if (event.key !== "Tab") return;
          const targets = sidebar.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)');
          if (!targets?.length) return;
          const first = targets[0], last = targets[targets.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
          if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
        }}
      >
        {/* Brand header */}
        <div className="sidebar-heading">
          <Link href="/admin/dashboard" className="admin-sidebar-brand" aria-label="AduAI, ruang admin">
            <Image src="/icon.png" alt="AduAI" width={80} height={80} className="admin-sidebar-logo" />
          </Link>
          <button
            type="button" aria-label="Tutup menu admin"
            onClick={() => setSidebarOpen(false)}
            className="sidebar-close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation links */}
        <nav className="admin-nav" aria-label="Navigasi admin">
          <p className="admin-nav-label">Ruang admin</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-4 h-4" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Bottom controls */}
        <div className="sidebar-bottom">
          <Link
            href="/"
          >
            <span className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span>Buka halaman warga</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>

          <button
            onClick={handleLogout}
            type="button"
          >
            <LogOut className="w-4 h-4" />
            <span>Keluar</span>
          </button>
        </div>
      </aside>
      {sidebarOpen && <button type="button" className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-label="Tutup latar menu" tabIndex={-1} />}

      {/* Main Content Area */}
      <main id="admin-content" className="admin-workspace">
        {/* Top bar on desktop */}
        <div className="admin-toolbar">
          <span className="admin-toolbar-title">Ruang pengelolaan AduAI</span>
        </div>

        <div className="legacy-ui admin-content">
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
        <div className="page-loading" role="status">
          Memuat portal admin...
        </div>
      }
    >
      <AdminLayoutInner>{children}</AdminLayoutInner>
    </Suspense>
  );
}
