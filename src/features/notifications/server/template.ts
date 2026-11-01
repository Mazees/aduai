import type { ComplaintStatus } from '@/types/complaint';

const STATUS_LABELS: Record<ComplaintStatus, string> = {
  NEW: 'Baru Diajukan',
  ACCEPTED: 'Diterima & Terverifikasi',
  IN_PROGRESS: 'Sedang Ditindaklanjuti Petugas',
  RESOLVED: 'Selesai Ditangani',
  REJECTED: 'Belum Dapat Ditindaklanjuti',
};

export function formatStatusNotificationMessage(params: {
  ticketNumber: string;
  status: ComplaintStatus;
  note?: string | null;
  aiSummary: string;
  evidenceUrl: string;
}): string {
  const note = params.note?.trim() ? `\n💬 *Catatan petugas:* ${params.note.trim()}\n` : '';
  return (
    `📢 *Pembaruan AduAI*\n\n` +
    `🎫 *Tiket:* ${params.ticketNumber}\n` +
    `📌 *Status:* ${STATUS_LABELS[params.status]}\n` +
    `📝 *Aduan:* ${params.aiSummary.trim()}\n` +
    note +
    `\n📎 *Bukti perubahan status:* ${params.evidenceUrl}\n\n` +
    `Simpan nomor tiket untuk memantau laporan Anda di AduAI.`
  );
}

export function formatSubmissionNotificationMessage(params: {
  ticketNumber: string;
  aiSummary: string;
}): string {
  return (
    `✅ *Laporan AduAI telah dibuat*\n\n` +
    `🎫 *Tiket:* ${params.ticketNumber}\n` +
    `📝 *Aduan:* ${params.aiSummary.trim()}\n` +
    `📌 *Status:* Menunggu validasi\n\n` +
    `Simpan nomor tiket untuk memantau laporan Anda.`
  );
}
