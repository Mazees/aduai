import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-container footer-inner">
        <div><Link href="/" className="footer-brand">AduAI</Link><p>Mulai dari cerita, lanjutkan dengan laporan yang jelas.</p></div>
        <nav aria-label="Navigasi footer"><Link href="/laporan/chat">Buat aduan</Link><Link href="/laporan/lacak">Lacak laporan</Link><Link href="/admin/login">Ruang admin</Link></nav>
      </div>
    </footer>
  );
}
