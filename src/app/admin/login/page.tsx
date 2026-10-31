"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, AlertCircle, ArrowLeft } from "lucide-react";
import { MockService } from "@/lib/mock-service";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const success = MockService.loginAdmin(email, password);
    if (success) {
      router.push("/admin/dashboard");
    } else {
      setErrorMsg("Email atau password tidak sesuai. Gunakan demo login di bawah.");
    }
  };

  const handleDemoLogin = () => {
    setEmail("admin@aduai.id");
    setPassword("admin123");
    MockService.loginAdmin("admin@aduai.id", "admin123");
    router.push("/admin/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#0b0f12] text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-sm w-full space-y-5">
        <div className="space-y-1">
          <span className="text-xs font-mono uppercase tracking-wider text-[#00a884]">
            Portal Petugas
          </span>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Masuk Pengelola AduAI
          </h1>
          <p className="text-xs text-slate-400">
            Akses verifikasi laporan dan tindak lanjut lapangan.
          </p>
        </div>

        <div className="bg-[#12181d] rounded-xl border border-slate-800 p-5 space-y-4">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Email Kedinasan
              </label>
              <input
                type="email"
                placeholder="admin@aduai.id"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#182026] border border-slate-700 text-white text-xs focus:border-[#00a884] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Kata Sandi
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-[#182026] border border-slate-700 text-white text-xs focus:border-[#00a884] outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs bg-[#008069] hover:bg-[#075e54] text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Masuk Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>

          {/* Quick 1-click Demo Login */}
          <div className="pt-3 border-t border-slate-800/80">
            <button
              type="button"
              onClick={handleDemoLogin}
              className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>Masuk Cepat Demo Admin</span>
            </button>
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-300 transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
