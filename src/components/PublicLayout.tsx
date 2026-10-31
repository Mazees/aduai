import React, { Suspense } from "react";
import Navbar from "./Navbar";
import Footer from "./Footer";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <Suspense fallback={<header className="h-16 bg-[#008069]" />}>
        <Navbar />
      </Suspense>
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
