import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AduAI | Ruang pengaduan warga",
  description: "Ceritakan masalah di sekitar Anda, periksa ringkasan aduan, dan ikuti perkembangannya melalui nomor tiket.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="id">
      <body>
        {children}
      </body>
    </html>
  );
}
