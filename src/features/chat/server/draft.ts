import type { ComplaintDraft } from "@/types/complaint";
import { normalizeWhatsapp, redactIdentity } from "@/lib/ai/privacy";

export function draftState(draft: ComplaintDraft | null) {
  const missingFields = [];
  if (!draft?.description.trim()) missingFields.push("description");
  if (!draft || !/^\+[1-9]\d{7,14}$/.test(draft.whatsapp)) missingFields.push("whatsapp");
  return { draft, missingFields, readyForConfirmation: missingFields.length === 0 };
}

// Tool memakai patch: field yang tidak diberikan atau string kosong tidak menghapus data lama.
export function mergeDraft(raw: string, old: ComplaintDraft | null, names: string[]): ComplaintDraft {
  const data: unknown = JSON.parse(raw);
  if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error("INVALID_DRAFT");
  const patch = data as Record<string, unknown>;
  const allowed = ["description", "category", "aiSummary", "whatsapp"];
  if (!Object.keys(patch).length || Object.keys(patch).some((key) => !allowed.includes(key))) throw new Error("INVALID_DRAFT");
  const next: ComplaintDraft = { description: "", category: null, aiSummary: "", whatsapp: "", ...old };
  for (const key of ["description", "aiSummary", "whatsapp"] as const) {
    if (patch[key] === undefined) continue;
    if (typeof patch[key] !== "string" || patch[key].length > (key === "whatsapp" ? 32 : key === "description" ? 5000 : 2000)) throw new Error("INVALID_DRAFT");
    if (patch[key].trim()) next[key] = patch[key].trim();
  }
  if (patch.category !== undefined && patch.category !== null) {
    if (typeof patch.category !== "string" || patch.category.length > 100) throw new Error("INVALID_DRAFT");
    if (patch.category.trim()) next.category = patch.category.trim();
  }
  next.description = redactIdentity(next.description, names);
  next.aiSummary = redactIdentity(next.aiSummary, names);
  next.whatsapp = normalizeWhatsapp(next.whatsapp);
  return next;
}

