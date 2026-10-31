import "server-only";
import type { AgentDependencies, ComplaintSubmittedHandler } from "@/features/chat/server/agent";

export interface AiServices {
  agent: AgentDependencies;
  // Backend menjadwalkan evaluasi setelah submit berhasil, termasuk saat klien terputus.
  onSubmitted: ComplaintSubmittedHandler;
}

// Titik wiring Dimas: ganti isi fungsi ini dengan pembacaan konfigurasi dan service backend.
// Tidak ada adapter pengganti; route mengembalikan 503 sampai integrasi tersedia.
export async function getAiServices(): Promise<AiServices> {
  throw new Error("AI_INTEGRATION_NOT_CONFIGURED");
}
