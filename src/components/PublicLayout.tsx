import React, { Suspense } from "react";
import CitizenNavigation from "./CitizenNavigation";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="citizen-shell">
      <a href="#main-content" className="skip-link">Langsung ke isi halaman</a>
      <Suspense fallback={<aside className="citizen-sidebar-placeholder" aria-label="Memuat navigasi" />}>
        <CitizenNavigation />
      </Suspense>
      <main id="main-content" className="legacy-ui public-content">{children}</main>
    </div>
  );
}
