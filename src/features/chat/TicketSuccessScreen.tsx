"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, CheckCircle2, Copy } from "lucide-react";

export default function TicketSuccessScreen({ ticketNumber, onNewChat }: { ticketNumber: string; onNewChat: () => void }) {
  const [copied, setCopied] = useState(false);
  async function copyTicket() {
    try { await navigator.clipboard.writeText(ticketNumber); setCopied(true); } catch { setCopied(false); }
  }
  return <section className="ticket-success" aria-live="polite">
    <div className="ticket-success-content">
      <div className="ticket-success-icon"><CheckCircle2 size={42} aria-hidden="true" /></div>
      <h1>Aduan berhasil dilaporkan</h1>
      <p>Simpan nomor tiket ini untuk melihat perkembangan aduan Anda.</p>
      <div className="ticket-number"><div><span>Nomor tiket</span><strong>{ticketNumber}</strong></div><button type="button" onClick={copyTicket} aria-label="Salin nomor tiket">{copied ? <Check size={18} /> : <Copy size={18} />}{copied ? "Tersalin" : "Salin"}</button></div>
      <div className="ticket-success-actions"><Link className="button-primary" href={`/laporan/lacak/${encodeURIComponent(ticketNumber)}`}>Lacak laporan</Link><button type="button" className="button-text" onClick={onNewChat}>Buat aduan lain</button></div>
    </div>
  </section>;
}
