import "server-only";
import { runChatAgent } from "./agent";
import { hasSubmissionConsent } from "./confirmation";
import { draftState, mergeDraft } from "./draft";
import { declaredNames } from "@/lib/ai/privacy";
import type { AiServices } from "@/lib/ai/services";
import type { ChatMessage, ChatStreamEvent } from "@/types/chat";
import type { ComplaintDraft } from "@/types/complaint";

const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function errorResponse(status: number, code: string, message: string) {
  return Response.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}

function validMessages(value: unknown): value is ChatMessage[] {
  return Array.isArray(value) && value.length > 0 && value.length <= 40 &&
    value.every((m) => m && typeof m === "object" && (m.role === "user" || m.role === "assistant") &&
      typeof m.content === "string" && m.content.trim().length > 0 && m.content.length <= 5000) &&
    value.at(-1)?.role === "user";
}

// Batas byte diperiksa sebelum JSON.parse, bukan sesudah seluruh payload ditampung.
async function boundedBody(request: Request): Promise<unknown> {
  if (!request.body) throw new Error("INVALID_JSON");
  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let bytes = 0, text = "";
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.length;
      if (bytes > 100_000) throw new Error("PAYLOAD_TOO_LARGE");
      text += decoder.decode(part.value, { stream: true });
    }
    return JSON.parse(text + decoder.decode());
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

export type GetAiServices = (request: Request) => Promise<AiServices>;

// Handler route Next.js; seluruh service berasal dari resolver backend.
export function createChatHandler(getServices: GetAiServices) {
  return async function POST(request: Request): Promise<Response> {
    const origin = request.headers.get("origin");
    if (origin && origin !== new URL(request.url).origin) {
      return errorResponse(403, "FORBIDDEN_ORIGIN", "Asal permintaan tidak diizinkan.");
    }
    let body: unknown;
    try { body = await boundedBody(request); }
    catch (error) {
      const large = error instanceof Error && error.message === "PAYLOAD_TOO_LARGE";
      return errorResponse(large ? 413 : 400, large ? "PAYLOAD_TOO_LARGE" : "INVALID_JSON",
        large ? "Pesan terlalu panjang." : "JSON tidak valid.");
    }
    if (!body || typeof body !== "object" || !("messages" in body) || !validMessages(body.messages)) {
      return errorResponse(400, "INVALID_REQUEST", "Pesan tidak valid.");
    }
    const history = body.messages;
    const sessionId = "sessionId" in body ? body.sessionId : undefined;
    const confirmed = "confirmed" in body ? body.confirmed : false;
    const idempotencyKey = request.headers.get("Idempotency-Key") ?? undefined;
    if ((sessionId !== undefined && (typeof sessionId !== "string" || !uuid.test(sessionId))) ||
        typeof confirmed !== "boolean" || (idempotencyKey !== undefined && !uuid.test(idempotencyKey))) {
      return errorResponse(400, "INVALID_REQUEST", "Sesi, konfirmasi, atau Idempotency-Key tidak valid.");
    }
    let draft: ComplaintDraft | null = null;
    try {
      if ("draft" in body && body.draft !== null && body.draft !== undefined) {
        const candidate = body.draft as Record<string, unknown>;
        if (typeof candidate.description !== "string" || typeof candidate.aiSummary !== "string" ||
            typeof candidate.whatsapp !== "string" || !(candidate.category === null || typeof candidate.category === "string")) {
          throw new Error("INVALID_DRAFT");
        }
        draft = mergeDraft(JSON.stringify(candidate), null, declaredNames(history));
      }
    } catch { return errorResponse(400, "INVALID_REQUEST", "Draft tidak valid."); }

    // Konfirmasi natural dan tombol kirim memakai validasi serta service submit yang sama.
    const consent = hasSubmissionConsent(history, confirmed);
    const ready = draftState(draft).readyForConfirmation;
    if (confirmed && !ready) return errorResponse(400, "DRAFT_INCOMPLETE", "Lengkapi dan periksa draft sebelum mengirim.");
    if (consent && ready) {
      if (!sessionId) return errorResponse(400, "SUBMISSION_SESSION_REQUIRED", "sessionId diperlukan untuk membuat tiket.");
      if (!idempotencyKey) return errorResponse(400, "SUBMISSION_KEY_REQUIRED", "Idempotency-Key diperlukan untuk membuat tiket.");
    }

    let services: AiServices;
    try {
      services = await getServices(request);
      const agent = services?.agent;
      if (!agent || typeof services.onSubmitted !== "function" ||
          (["complete", "submit", "mainKnowledge", "persona", "search", "track"] as const).some((key) => typeof agent[key] !== "function")) {
        throw new Error("AI_INTEGRATION_NOT_CONFIGURED");
      }
    } catch (error) {
      const missing = error instanceof Error && error.message === "AI_INTEGRATION_NOT_CONFIGURED";
      return errorResponse(503, missing ? "AI_INTEGRATION_NOT_CONFIGURED" : "AI_INTEGRATION_UNAVAILABLE",
        missing ? "Integrasi backend AI belum dikonfigurasi." : "Layanan backend AI belum tersedia.");
    }

    const encoder = new TextEncoder();
    const cancellation = new AbortController();
    const signal = AbortSignal.any([request.signal, cancellation.signal]);
    let closed = false;
    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        // Status operasional dan jawaban saja; argumen tool serta secret tidak disiarkan.
        const emit = (event: ChatStreamEvent) => {
          if (!closed && !signal.aborted) {
            controller.enqueue(encoder.encode("event: " + event.event + "\ndata: " + JSON.stringify(event.data) + "\n\n"));
          }
        };
        try {
          await runChatAgent(history, draft, emit, signal, services.agent, {
            sessionId: sessionId as string | undefined, confirmed, idempotencyKey,
            onSubmitted: (submission, conversation) => services.onSubmitted(submission, conversation),
          });
        } finally {
          if (!closed) { closed = true; controller.close(); }
        }
      },
      cancel() { closed = true; cancellation.abort(); },
    });
    return new Response(stream, { headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no",
    } });
  };
}
