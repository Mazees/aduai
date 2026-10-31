import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AduAI — Pengaduan Warga Berbasis AI Empatis & Notifikasi WhatsApp",
  description: "Layanan pengaduan masyarakat cepat, empatis, 100% anonim, dan berbukti nyata terintegrasi langsung ke WhatsApp.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body className="antialiased text-[#111b21] bg-slate-50 selection:bg-[#25d366]/30 selection:text-[#075e54]">
        {children}
      </body>
    </html>
  );
}
