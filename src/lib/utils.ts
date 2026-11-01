export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

export function formatDateTime(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
    }).format(date);
  } catch {
    return isoString;
  }
}

export function normalizeWhatsApp(phone: string): string {
  const cleaned = phone.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+62")) return cleaned;
  if (cleaned.startsWith("62")) return "+" + cleaned;
  if (cleaned.startsWith("0")) return "+62" + cleaned.substring(1);
  if (cleaned.length > 8 && !cleaned.startsWith("+")) return "+62" + cleaned;
  return cleaned;
}

