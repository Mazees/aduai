import type { ComplaintStatus } from '@/types/complaint';

const STATUS_LABELS: Record<ComplaintStatus, string> = {
  NEW: 'Baru Diajukan',
  ACCEPTED: 'Diterima & Terverifikasi',
  IN_PROGRESS: 'Sedang Ditindaklanjuti Petugas',
  RESOLVED: 'Selesai Ditangani',
  REJECTED: 'Belum Dapat Ditindaklanjuti',
};

/**
 * Menyusun format pesan WhatsApp resmi AduAI saat ada pembaruan status laporan
 */
export function formatStatusNotificationMessage(params: {
  ticketNumber: string;
  status: ComplaintStatus;
  note?: string | null;
  aiSummary: string;
}): string {
  const statusLabel = STATUS_LABELS[params.status] || params.status;
  const noteSection = params.note && params.note.trim()
    ? `\n💬 *Catatan Petugas:* \n${params.note.trim()}\n`
    : '';

  return (
    `📢 *Pembaruan Status Laporan - AduAI*\n\n` +
    `Halo, laporan aduan Anda telah diperbarui oleh tim penanganan:\n\n` +
    `🎫 *Nomor Tiket:* ${params.ticketNumber}\n` +
    `📌 *Status Terkini:* ${statusLabel}\n` +
    `📝 *Ringkasan Aduan:* \n_${params.aiSummary.trim()}_\n` +
    noteSection +
    `\nAnda dapat memantau perkembangan dan bukti penanganan kapan saja melalui portal AduAI dengan memasukkan nomor tiket 6 digit Anda: *${params.ticketNumber}*.\n\n` +
    `Terima kasih telah berpartisipasi menjaga keteraturan dan kenyamanan bersama.\n\n` +
    `_Pesan ini dikirim otomatis oleh sistem AduAI._`
  );
}

/**
 * Menyusun format pesan WhatsApp konfirmasi saat aduan pertama kali berhasil diajukan
 */
export function formatSubmissionNotificationMessage(params: {
  ticketNumber: string;
  aiSummary: string;
}): string {
  return (
    `✅ *Laporan Berhasil Diterima - AduAI*\n\n` +
    `Halo, laporan Anda telah berhasil didaftarkan ke dalam sistem penanganan AduAI:\n\n` +
    `🎫 *Nomor Tiket:* ${params.ticketNumber}\n` +
    `📝 *Ringkasan Aduan:* \n_${params.aiSummary.trim()}_\n` +
    `📌 *Status:* Baru Diajukan (Menunggu verifikasi admin)\n\n` +
    `Simpan nomor tiket Anda (*${params.ticketNumber}*) untuk melacak status dan progres penanganan laporan di portal resmi AduAI.\n\n` +
    `_Pesan ini dikirim otomatis oleh sistem AduAI._`
  );
}
