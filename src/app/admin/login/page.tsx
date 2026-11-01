"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, AlertCircle, ArrowLeft } from "lucide-react";
import { clearAdminSession, currentSession, saveAdminSession, type AdminSession } from '@/lib/auth/admin-session';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  useEffect(() => {
    let active = true;
    async function checkSession() {
      try {
        const session = await currentSession();
        if (!session || !active) return;
        const response = await fetch('/api/admin/auth/me', {
          headers: { Authorization: `Bearer ${session.access_token}` },
          cache: 'no-store',
        });
        if (!active) return;
        if (response.ok) {
          router.replace('/admin/dashboard');
          return;
        }
        if (response.status === 401) clearAdminSession();
        else setErrorMsg('Sesi belum dapat diperiksa. Silakan coba masuk kembali.');
      } catch {
        if (active) setErrorMsg('Koneksi gagal. Silakan coba masuk kembali.');
      } finally {
        if (active) setCheckingSession(false);
      }
    }
    void checkSession();
    return () => { active = false; };
  }, [router]);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorMsg(null);
    setLoading(true);
    try {
      const response = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await response.json() as { data?: { session: AdminSession | null }; error?: { message: string } };
      if (!response.ok || !body.data?.session) {
        setErrorMsg(body.error?.message || 'Gagal masuk. Periksa email dan kata sandi.');
        return;
      }
      saveAdminSession(body.data.session);
      router.replace('/admin/dashboard');
    } catch {
      setErrorMsg('Koneksi gagal. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) return <div className="admin-login-page"><p role="status" className="text-sm text-slate-600">Memeriksa sesi...</p></div>;

  return (
    <div className="admin-login-page">
      <div className="admin-login-inner">
        <div className="space-y-1">
          <span className="text-xs font-semibold text-primary">Ruang admin</span>
          <h1 className="text-xl font-bold tracking-tight text-primary">Masuk Pengelola AduAI</h1>
          <p className="text-sm text-slate-600">Akses verifikasi laporan dan tindak lanjut lapangan.</p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
          {errorMsg && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-3.5">
            <div>
              <label htmlFor="admin-email" className="text-sm font-medium text-slate-700 block mb-1">Email admin</label>
              <input id="admin-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:border-primary outline-none" />
            </div>
            <div>
              <label htmlFor="admin-password" className="text-sm font-medium text-slate-700 block mb-1">Kata sandi</label>
              <input id="admin-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-900 text-sm focus:border-primary outline-none" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg font-semibold text-xs bg-primary hover:bg-dark text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-60">
              <span>{loading ? 'Memeriksa akun...' : 'Masuk dashboard'}</span><ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
        <div className="text-center">
          <Link href="/" className="text-xs text-slate-500 hover:text-primary transition-colors inline-flex items-center gap-1">
            <ArrowLeft className="w-3 h-3" /><span>Kembali ke beranda</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
