// Lapisan deterministik untuk nomor/email dan nama yang dinyatakan secara eksplisit.
// Ini belum dapat mengenali semua identitas dalam bahasa alami; backend tetap perlu memvalidasi.
export function redactContacts(text: string): string {
  return text.replace(/\b[\w.+-]+@[\w.-]+\.[a-z]{2,}\b/gi, "[email disamarkan]")
    .replace(/(?:\+?\d[\d ().-]{7,}\d)/g, "[nomor disamarkan]");
}
export function declaredNames(messages: { role: string; content: string }[]): string[] {
  return messages.filter((m) => m.role === "user").flatMap((m) =>
    [...m.content.matchAll(/(?:nama saya|saya bernama)\s+([\p{L}]+(?:[ -][\p{L}]+){0,3})(?=[,.!\n]|$)/giu)].map((v) => v[1]));
}
export function redactIdentity(text: string, names: string[] = []): string {
  let result = redactContacts(text);
  for (const name of names) result = result.replace(new RegExp(name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "[nama disamarkan]");
  return result;
}
export function normalizeWhatsapp(value: string): string {
  const digits = value.replace(/[\s().-]/g, "");
  if (/^08\d{7,12}$/.test(digits)) return "+62" + digits.slice(1);
  if (/^62\d{8,13}$/.test(digits)) return "+" + digits;
  return digits;
}

