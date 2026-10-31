// Batas bersama untuk input dashboard dan validasi server.
export const MAIN_KNOWLEDGE_MAX_CHARACTERS = 3000;

export function validateMainKnowledge(value: unknown): string {
  if (typeof value !== "string" || value.length > MAIN_KNOWLEDGE_MAX_CHARACTERS) {
    throw new Error("INVALID_MAIN_KNOWLEDGE");
  }
  return value.trim();
}

