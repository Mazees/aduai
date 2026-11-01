"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Menu, MessageSquare, Search, X } from "lucide-react";

export default function CitizenNavigation() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const drawer = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const button = menuButton.current;
    drawer.current?.querySelector<HTMLButtonElement>("button")?.focus();
    return () => button?.focus();
  }, [open]);

  const links = [
    {
      href: "/laporan/chat",
      label: "Percakapan",
      icon: MessageSquare,
      active:
        pathname.startsWith("/laporan/chat") ||
        pathname.startsWith("/aduan/buat"),
    },
    {
      href: "/laporan/lacak",
      label: "Lacak status",
      icon: Search,
      active:
        pathname.startsWith("/laporan/lacak"),
    },
  ];

  return (
    <>
      <header className="citizen-mobile-header">
        <button
          ref={menuButton}
          type="button"
          className="theme-toggle"
          aria-label="Buka menu warga"
          aria-expanded={open}
          aria-controls="citizen-navigation"
          onClick={() => setOpen(true)}
        >
          <Menu size={21} />
        </button>
        <Link href="/" className="workspace-mobile-brand">
          <Image src="/icon.png" alt="" width={40} height={40} />
          <span><strong>AduAI</strong><small>Ruang warga</small></span>
        </Link>
      </header>
      {open && (
        <button
          type="button"
          className="citizen-drawer-backdrop"
          aria-label="Tutup menu warga"
          tabIndex={-1}
          onClick={() => setOpen(false)}
        />
      )}
      <aside
        id="citizen-navigation"
        ref={drawer}
        className={`citizen-sidebar${open ? " is-open" : ""}`}
        role={open ? "dialog" : undefined}
        aria-modal={open ? true : undefined}
        aria-label="Menu warga"
        onKeyDown={(event) => {
          if (!open) return;
          if (event.key === "Escape") setOpen(false);
          if (event.key !== "Tab") return;
          const targets = drawer.current?.querySelectorAll<HTMLElement>(
            "a[href], button:not(:disabled)",
          );
          if (!targets?.length) return;
          const first = targets[0],
            last = targets[targets.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
          }
          if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
          }
        }}
      >
        <div className="citizen-sidebar-heading">
          <Link
            href="/"
            aria-label="AduAI, beranda"
            onClick={() => setOpen(false)}
          >
            <Image
              src="/icon.png"
              alt="AduAI"
              width={80}
              height={80}
              className="citizen-logo"
            />
          </Link>
          <button
            type="button"
            className="citizen-drawer-close theme-toggle"
            aria-label="Tutup menu warga"
            onClick={() => setOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        <p className="citizen-sidebar-label">Ruang warga</p>
        <nav className="citizen-nav" aria-label="Navigasi warga">
          {links.map(({ href, label, icon: Icon, active }) => (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <Icon size={19} aria-hidden="true" />
              {label}
            </Link>
          ))}
        </nav>
        <div className="citizen-sidebar-bottom">
          <Link href="/" onClick={() => setOpen(false)}>
            <ArrowLeft size={18} aria-hidden="true" /> Kembali ke beranda
          </Link>
        </div>
      </aside>
    </>
  );
}
