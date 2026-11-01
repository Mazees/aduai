import type { ChatMessage } from "@/types/chat";

// Persetujuan tidak boleh ditebak dari kalimat panjang atau pesan yang masih berisi perubahan.
export function hasSubmissionConsent(messages: ChatMessage[], explicit = false): boolean {
  if (explicit) return true; // Tombol kirim yang dilakukan pengadu setelah memeriksa draft.
  const latest = messages.at(-1);
  const previous = messages.at(-2);
  if (latest?.role !== "user" || previous?.role !== "assistant") return false;
  const answer = latest.content.toLowerCase().trim().replace(/[.!]+$/g, "").replace(/\s+/g, " ");
  const accepted = ["sudah", "sudah benar", "sudah sesuai", "iya", "iya benar", "iya sudah benar", "ya", "ya benar", "benar", "setuju",
    "kirim", "kirim aduan", "kirim laporan", "ya kirim", "ya kirim aduan", "semua sudah benar"];
  // "Ya" baru dianggap konfirmasi jika AI sebelumnya benar-benar meminta pemeriksaan draft.
  const reviewed = /konfirmasi|apakah[\s\S]{0,200}(?:benar|sesuai)|(?:periksa|cek)[\s\S]{0,120}(?:draft|draf|data)/i.test(previous.content);
  return reviewed && accepted.includes(answer);
}


