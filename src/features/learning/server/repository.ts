// Kontrak yang diimplementasikan backend Dimas. Modul AI tidak mengatur database/SQL.
export type PersonaRule = { type: "POSITIVE" | "NEGATIVE"; content: string };
export type Evaluation = { evaluation: string; positivePrompts: string[]; negativePrompts: string[] };
export interface LearningRepository {
  context(signal?: AbortSignal): Promise<{ evaluations: string[]; prompts: PersonaRule[] }>;
  claim(complaintId: string, token: string, signal?: AbortSignal): Promise<boolean>;
  commit(complaintId: string, token: string, result: Evaluation, signal?: AbortSignal): Promise<void>;
  fail(complaintId: string, token: string): Promise<void>;
}

