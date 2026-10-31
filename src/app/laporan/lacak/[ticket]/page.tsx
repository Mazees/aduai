"use client";

import { Suspense, use, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Check, Copy, FileText } from "lucide-react";
import PublicLayout from "@/components/PublicLayout";
import StatusBadge from "@/components/StatusBadge";
import { MockService } from "@/lib/mock-service";
import { formatDateTime } from "@/lib/utils";
import type { Complaint, ComplaintStatus } from "@/types/complaint";

const STEPS: { status: ComplaintStatus; label: string }[] = [
  { status: "NEW", label: "Laporan dibuat" },
  { status: "ACCEPTED", label: "Diterima" },
  { status: "IN_PROGRESS", label: "Sedang ditangani" },
  { status: "RESOLVED", label: "Selesai" },
];

function TicketContent({ params }: { params: Promise<{ ticket: string }> }) {
  const { ticket } = use(params);
  const ticketNumber = decodeURIComponent(ticket);
  const [complaint] = useState<Complaint | null>(
    () => MockService.getComplaintByTicket(ticketNumber) ?? null,
  );
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  async function copyTicketLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopyFeedback("Tautan disalin");
    } catch {
      setCopyFeedback("Tautan gagal disalin");
    }
  }

  if (!complaint) {
    return (
      <div className="tracking-detail-page">
        <div className="ticket-empty">
          <h2>Nomor tiket tidak ditemukan</h2>
          <p>Periksa kembali nomor tiket yang Anda masukkan.</p>
          <Link href="/laporan/lacak">Cari tiket lain</Link>
        </div>
      </div>
    );
  }

  const currentStep = STEPS.findIndex(
    (step) => step.status === complaint.status,
  );
  const updates = [...complaint.updates].reverse();

  return (
    <div className="tracking-detail-page">
      <div className="ticket-content">
        <div className="ticket-actions">
          <Link href="/laporan/lacak" className="ticket-back">
            <ArrowLeft aria-hidden="true" size={18} />
            <span>Kembali ke pencarian</span>
          </Link>
          <div className="ticket-copy-wrap">
            <button
              type="button"
              onClick={copyTicketLink}
              className="ticket-copy"
            >
              {copyFeedback === "Tautan disalin" ? (
                <>
                  <Check aria-hidden="true" size={17} /> {copyFeedback}
                </>
              ) : (
               <><Copy aria-hidden="true" size={17} />Salin tautan</> 
              )}
            </button>
          </div>
        </div>

        <article className="ticket-panel ticket-summary">
          <div className="ticket-summary-heading">
            <div>
              <p className="ticket-eyebrow">Nomor tiket</p>
              <h2>{complaint.ticketNumber}</h2>
            </div>
            <StatusBadge status={complaint.status} />
          </div>
          <p className="ticket-meta">
            {complaint.category || "Aduan warga"}
            <span aria-hidden="true"> · </span>
            {formatDateTime(complaint.createdAt)}
          </p>
          <div className="ticket-summary-body">
            <div>
              <h3>Ringkasan aduan</h3>
              <p className="ticket-summary-lead">{complaint.aiSummary}</p>
            </div>
            <div>
              <h3>Uraian laporan</h3>
              <p>{complaint.description}</p>
            </div>
          </div>
        </article>

        {complaint.status === "REJECTED" ? (
          <section
            className="ticket-panel ticket-rejected"
            aria-label="Status laporan"
          >
            <h2>Laporan ditolak</h2>
            <p>Lihat alasan dan catatan petugas pada riwayat di bawah.</p>
          </section>
        ) : (
          <section
            className="ticket-panel ticket-progress"
            aria-labelledby="ticket-progress-title"
          >
            <h2 id="ticket-progress-title">Perkembangan laporan</h2>
            <ol>
              {STEPS.map((step, index) => (
                <li
                  key={step.status}
                  className={
                    index < currentStep
                      ? "is-complete"
                      : index === currentStep
                        ? "is-current"
                        : "is-pending"
                  }
                  aria-current={index === currentStep ? "step" : undefined}
                >
                  <span className="ticket-step-marker" aria-hidden="true">
                    {index < currentStep ? <Check size={14} /> : index + 1}
                  </span>
                  <span>{step.label}</span>
                </li>
              ))}
            </ol>
          </section>
        )}

        <section
          className="ticket-panel ticket-history"
          aria-labelledby="ticket-history-title"
        >
          <h2 id="ticket-history-title">Riwayat penanganan</h2>
          <ol>
            {updates.map((update) => (
              <li key={update.id} className="ticket-history-item">
                <div className="ticket-history-top">
                  <StatusBadge status={update.status} size="sm" />
                  <time dateTime={update.createdAt}>
                    {formatDateTime(update.createdAt)}
                  </time>
                </div>
                {update.note && <p>{update.note}</p>}
                {update.rejectionReason && (
                  <p className="ticket-reason">
                    <strong>Alasan penolakan:</strong> {update.rejectionReason}
                  </p>
                )}
                {update.evidence.length > 0 && (
                  <div className="ticket-evidence">
                    <h3>Bukti yang dilampirkan</h3>
                    <ul>
                      {update.evidence.map((evidence) => (
                        <li key={evidence.id}>
                          <FileText aria-hidden="true" size={17} />
                          {evidence.url ? (
                            <a
                              href={evidence.url}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {evidence.fileName}
                            </a>
                          ) : (
                            <span>{evidence.fileName}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </li>
            ))}
            <li className="ticket-history-item">
              <div className="ticket-history-top">
                <strong>Laporan dibuat</strong>
                <time dateTime={complaint.createdAt}>
                  {formatDateTime(complaint.createdAt)}
                </time>
              </div>
              <p>Aduan Anda telah tercatat dengan nomor tiket ini.</p>
            </li>
          </ol>
        </section>
      </div>
    </div>
  );
}

export default function TicketPage({
  params,
}: {
  params: Promise<{ ticket: string }>;
}) {
  return (
    <PublicLayout>
      <div className="tracking-page">
        <header className="tracking-header">
          <h1>Detail laporan</h1>
        </header>
        <Suspense
          fallback={
            <div className="tracking-detail-page">
              <p>Memuat rincian tiket...</p>
            </div>
          }
        >
          <TicketContent params={params} />
        </Suspense>
      </div>
    </PublicLayout>
  );
}
