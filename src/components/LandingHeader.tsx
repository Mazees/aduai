"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";

const sections = [
  { href: "#beranda", label: "Beranda" },
  { href: "#tentang", label: "Tentang" },
  { href: "#alur", label: "Cara kerja" },
  { href: "#fitur", label: "Fitur AduAI" },
  { href: "#tindak-lanjut", label: "Tindak lanjut" },
];

export default function LandingHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButton = useRef<HTMLButtonElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);
  const menuPanel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => setScrolled(window.scrollY > 48);
    update();
    window.addEventListener("scroll", update, { passive: true });
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const originalBehavior = document.documentElement.style.scrollBehavior;
    const originalPadding = document.documentElement.style.scrollPaddingTop;
    const updateScrollPadding = () => { document.documentElement.style.scrollPaddingTop = window.innerWidth >= 768 ? "64px" : "58px"; };
    updateScrollPadding();
    window.addEventListener("resize", updateScrollPadding);
    const updateScrollBehavior = () => { document.documentElement.style.scrollBehavior = preference.matches ? "auto" : "smooth"; };
    updateScrollBehavior();
    preference.addEventListener("change", updateScrollBehavior);
    return () => {
      window.removeEventListener("scroll", update);
      preference.removeEventListener("change", updateScrollBehavior);
      document.documentElement.style.scrollBehavior = originalBehavior;
      document.documentElement.style.scrollPaddingTop = originalPadding;
      window.removeEventListener("resize", updateScrollPadding);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    const returnFocus = menuButton.current;
    document.body.style.overflow = "hidden";
    closeButton.current?.focus();
    const desktop = window.matchMedia("(min-width: 768px)");
    const onResize = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", onResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      desktop.removeEventListener("change", onResize);
      returnFocus?.focus();
    };
  }, [menuOpen]);

  const handleMenuKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") { setMenuOpen(false); return; }
    if (event.key !== "Tab") return;
    const focusable = menuPanel.current?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)');
    if (!focusable?.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className={`mx-auto transition-all duration-300 motion-reduce:transition-none ${scrolled ? "w-full bg-primary/95 shadow-md shadow-dark/15 backdrop-blur-md" : "w-full bg-transparent"}`}>
        <div className={`mx-auto flex w-full max-w-[1200px] items-center justify-between gap-3 px-5 transition-[min-height] duration-300 motion-reduce:transition-none ${scrolled ? "min-h-[58px] md:min-h-[64px]" : "min-h-[72px] md:min-h-[88px]"}`}>
          <a href="#beranda" aria-label="AduAI, beranda" className="shrink-0">
            <Image src="/icon_light.png" alt="AduAI" width={60} height={60} priority className={`object-contain transition-[width,height] duration-300 motion-reduce:transition-none ${scrolled ? "h-[48px] w-[48px] md:h-[56px] md:w-[56px]" : "h-[60px] w-[60px] md:h-[78px] md:w-[78px]"}`} />
          </a>
          <nav aria-label="Navigasi beranda" className="hidden items-center gap-[clamp(18px,3vw,38px)] text-sm text-white/85 md:flex [&_a:hover]:text-white">
            {sections.map((section) => <a key={section.href} href={section.href}>{section.label}</a>)}
            <Link href="/admin/login" className="rounded-lg border border-white/40 px-4 py-2 font-semibold text-white transition-colors hover:bg-white/10">Login admin</Link>
          </nav>
          <button ref={menuButton} type="button" aria-label="Buka menu" aria-expanded={menuOpen} aria-controls="landing-mobile-menu" onClick={() => setMenuOpen(true)} className="inline-flex min-h-11 min-w-11 items-center justify-center text-white md:hidden">
            <Menu size={27} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
      </div>
      {menuOpen && (
        <div id="landing-mobile-menu" ref={menuPanel} role="dialog" aria-modal="true" aria-label="Menu navigasi" onKeyDown={handleMenuKeyDown} className="fixed inset-0 z-50 flex min-h-[100dvh] flex-col overflow-y-auto bg-dark text-white md:hidden">
          <div className="flex items-center px-5 pt-4">
            <button ref={closeButton} type="button" aria-label="Tutup menu" onClick={() => setMenuOpen(false)} className="inline-flex min-h-11 min-w-11 items-center justify-center text-white"><X size={27} aria-hidden="true" /></button>
          </div>
          <div className="flex flex-1 flex-col items-center px-6 pb-12 pt-10 sm:pt-16">
            <Image src="/icon_light.png" alt="AduAI" width={145} height={145} className="h-[145px] w-[145px] object-contain" />
            <nav aria-label="Navigasi beranda seluler" className="mt-5 flex w-full max-w-xs flex-col items-center gap-2 text-center text-lg">
              {sections.map((section) => <a key={section.href} href={section.href} onClick={() => setMenuOpen(false)} className="flex min-h-14 w-full items-center justify-center rounded-lg px-4 text-white transition-colors hover:bg-white/10">{section.label}</a>)}
              <Link href="/admin/login" onClick={() => setMenuOpen(false)} className="mt-5 inline-flex min-h-12 items-center justify-center rounded-lg bg-white px-6 text-base font-semibold text-primary transition-colors hover:bg-white/90">Login admin</Link>
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
