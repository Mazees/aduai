"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/laporan/chat", label: "Percakapan" },
    { href: "/laporan/lacak", label: "Lacak status" },
  ];

  return (
    <header
      className="site-header"
      onKeyDown={(event) => {
        if (event.key === "Escape") setMobileMenuOpen(false);
      }}
    >
      <div className="site-container">
        <div className="header-inner">
          {/* Logo Brand */}
          <Link href="/" className="wordmark" aria-label="AduAI, beranda">
            <Image
              src="/icon.png"
              alt=""
              width={64}
              height={64}
              className="header-logo"
            />
            <span className="wordmark-caption">Ruang pengaduan warga</span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="desktop-nav" aria-label="Navigasi utama">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? "page" : undefined}
                >
                  {link.label}
                </Link>
              );
            })}

            {/* Portal Admin link */}
            <Link href="/admin/login" className="admin-entry">
              Ruang admin
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="header-actions">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="mobile-menu-button"
              aria-label={mobileMenuOpen ? "Tutup menu" : "Buka menu"}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <nav
          id="mobile-navigation"
          aria-label="Navigasi seluler"
          className="site-container mobile-nav mobile-nav-container"
        >
          <Link
            href="/laporan/chat"
            onClick={() => setMobileMenuOpen(false)}
            aria-current={
              pathname.startsWith("/laporan/chat") ? "page" : undefined
            }
          >
            Percakapan
          </Link>
          <Link
            href="/laporan/lacak"
            onClick={() => setMobileMenuOpen(false)}
            aria-current={
              pathname.startsWith("/laporan/lacak") ? "page" : undefined
            }
          >
            Lacak status
          </Link>
          <Link href="/admin/login" onClick={() => setMobileMenuOpen(false)}>
            Ruang admin
          </Link>
        </nav>
      )}
    </header>
  );
}
