export interface AdminSession {
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

const KEY = 'aduai.admin.session';

// localStorage membuat sesi tersedia di tab lain; sesi lama dipindahkan saat dibaca.
export function saveAdminSession(session: AdminSession): void {
  localStorage.setItem(KEY, JSON.stringify(session));
  sessionStorage.removeItem(KEY);
}

export function clearAdminSession(): void {
  localStorage.removeItem(KEY);
  sessionStorage.removeItem(KEY);
}

export function getAdminSession(): AdminSession | null {
  try {
    const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as Partial<AdminSession>;
    if (typeof value.access_token !== 'string' || !value.access_token ||
        typeof value.refresh_token !== 'string' || !value.refresh_token ||
        typeof value.expires_at !== 'number') return null;
    const session = value as AdminSession;
    if (!localStorage.getItem(KEY)) saveAdminSession(session);
    return session;
  } catch {
    return null;
  }
}

let refreshPromise: Promise<AdminSession | null> | null = null;

export async function currentSession(): Promise<AdminSession | null> {
  const session = getAdminSession();
  if (!session) return null;
  if (session.expires_at > Date.now() / 1000 + 30) return session;
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const response = await fetch('/api/admin/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: session.refresh_token }),
    });
    if (!response.ok) {
      if (response.status === 401 && getAdminSession()?.refresh_token === session.refresh_token) clearAdminSession();
      if (response.status !== 401) throw new Error('Sesi belum dapat diperbarui');
      return getAdminSession();
    }
    const body = await response.json() as { data?: { session?: AdminSession } };
    if (!body.data?.session) throw new Error('Sesi belum dapat diperbarui');
    // Jangan menghidupkan kembali sesi jika admin keluar ketika refresh berlangsung.
    if (getAdminSession()?.refresh_token !== session.refresh_token) return getAdminSession();
    saveAdminSession(body.data.session);
    return body.data.session;
  })();
  try { return await refreshPromise; } finally { refreshPromise = null; }
}

/** Semua fetch admin memakai access token Supabase Auth; token tidak masuk query string. */
export async function adminFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const session = await currentSession();
  if (!session) {
    if (typeof window !== 'undefined') window.location.assign('/admin/login');
    throw new Error('Sesi admin tidak tersedia');
  }
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${session.access_token}`);
  const response = await fetch(input, { ...init, headers });
  if (response.status === 401) {
    if (getAdminSession()?.access_token === session.access_token) {
      clearAdminSession();
      if (typeof window !== 'undefined') window.location.assign('/admin/login');
    }
  }
  return response;
}
