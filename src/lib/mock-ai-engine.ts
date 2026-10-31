import { ChatMessage, AgentStep, ChatStreamEvent } from "@/types/chat";
import { ComplaintDraft } from "@/types/complaint";
import { normalizeWhatsApp } from "./utils";

export interface AgentProcessStep {
  toolCallId: string;
  step: AgentStep;
  label: string;
  status: "pending" | "running" | "completed" | "failed";
}

export function extractPhoneFromText(text: string): string | null {
  const match = text.match(/(\+?62|08)[0-9\s-]{8,14}/);
  if (match) {
    return normalizeWhatsApp(match[0].replace(/[\s-]/g, ""));
  }
  return null;
}

export function analyzeMessageCategory(text: string): {
  category: string;
  summary: string;
  empathy: string;
  promptQuestion?: string;
} {
  const lower = text.toLowerCase();

  if (lower.includes("jalan") || lower.includes("lubang") || lower.includes("aspal") || lower.includes("rusak")) {
    return {
      category: "Infrastruktur & Jalan",
      summary: "Aduan mengenai kerusakan jalan atau lubang berpotensi membahayakan warga.",
      empathy: "Saya memahami kekhawatiran Anda. Kondisi jalan yang rusak atau berlubang memang sangat berbahaya bagi keselamatan para pengguna jalan dan anak-anak.",
      promptQuestion: "Bisa sebutkan nama jalan atau patokan lokasi terdekat (misalnya nomor rumah, gedung, atau tanda fisik)? Serta jangan lupa cantumkan nomor WhatsApp Anda agar progres perbaikan bisa dikirim langsung.",
    };
  }

  if (lower.includes("sampah") || lower.includes("bau") || lower.includes("limbah") || lower.includes("kotor")) {
    return {
      category: "Kebersihan & Lingkungan",
      summary: "Aduan terkait tumpukan sampah liar atau masalah sanitasi lingkungan.",
      empathy: "Terima kasih sudah peduli dengan kebersihan lingkungan bersama. Tumpukan sampah yang membusuk tentu sangat mengganggu kenyamanan dan kesehatan warga sekitar.",
      promptQuestion: "Di titik mana tepatnya tumpukan sampah tersebut berada? Mohon sertakan juga nomor WhatsApp Anda agar petugas dapat mengirimkan bukti foto saat sampah sudah diangkut.",
    };
  }

  if (lower.includes("lampu") || lower.includes("pju") || lower.includes("gelap") || lower.includes("padam")) {
    return {
      category: "Fasilitas Umum & PJU",
      summary: "Aduan terkait lampu penerangan jalan umum (PJU) yang padam.",
      empathy: "Penerangan jalan yang padam di malam hari sangat memprihatinkan karena berisiko menimbulkan kecelakaan maupun kerawanan kriminalitas.",
      promptQuestion: "Apakah Anda tahu nomor tiang atau rentang jalan yang lampunya padam? Serta sertakan nomor WhatsApp untuk pelacakan tiket perbaikan.",
    };
  }

  if (lower.includes("banjir") || lower.includes("got") || lower.includes("selokan") || lower.includes("drainase") || lower.includes("air")) {
    return {
      category: "Drainase & Pengendalian Banjir",
      summary: "Aduan mengenai sumbatan saluran drainase atau potensi luapan air.",
      empathy: "Saluran air yang tersumbat memang harus segera ditindaklanjuti, apalagi ketika intensitas curah hujan tinggi agar air tidak meluap ke pemukiman warga.",
      promptQuestion: "Berapa kira-kira perkiraan panjang saluran yang tersumbat dan di RT/RW mana lokasinya? Mohon sertakan juga nomor WhatsApp Anda.",
    };
  }

  return {
    category: "Layanan Umum Warga",
    summary: text.slice(0, 100) + (text.length > 100 ? "..." : ""),
    empathy: "Terima kasih telah menyampaikan laporan ini kepada kami. Setiap aspirasi dan keluhan warga sangat penting untuk perbaikan fasilitas pelayanan publik kota kita.",
    promptQuestion: "Untuk melengkapi laporan resmi Anda, mohon pastikan lokasi spesifik sudah jelas dan sertakan nomor WhatsApp Anda agar Anda menerima notifikasi otomatis ketika laporan mulai diproses dinas terkait.",
  };
}

export async function simulateAgentResponse(
  userMessage: string,
  history: ChatMessage[],
  currentDraft: ComplaintDraft | null,
  onEvent: (event: ChatStreamEvent) => void,
  abortSignal?: AbortSignal
): Promise<{ reply: string; draft: ComplaintDraft; readyForConfirmation: boolean; missingFields: string[] }> {
  const runId = "run-" + Date.now();
  let seq = 1;

  // 1. Run started
  onEvent({
    event: "run.started",
    data: { runId, seq: seq++, startedAt: new Date().toISOString() },
  });

  if (abortSignal?.aborted) throw new Error("Aborted");

  // Helper sleep
  const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  // Step 1: UNDERSTAND_CONTEXT
  await delay(250);
  if (abortSignal?.aborted) throw new Error("Aborted");
  onEvent({
    event: "step.started",
    data: {
      runId,
      seq: seq++,
      toolCallId: "call-understand",
      step: "UNDERSTAND_CONTEXT",
      label: "Memahami konteks & situasi aduan warga",
    },
  });

  await delay(350);
  if (abortSignal?.aborted) throw new Error("Aborted");
  onEvent({
    event: "step.completed",
    data: {
      runId,
      seq: seq++,
      toolCallId: "call-understand",
      step: "UNDERSTAND_CONTEXT",
      label: "Konteks aduan berhasil dipahami",
    },
  });

  // Step 2: CHECK_COMPLAINT
  await delay(200);
  if (abortSignal?.aborted) throw new Error("Aborted");
  onEvent({
    event: "step.started",
    data: {
      runId,
      seq: seq++,
      toolCallId: "call-check",
      step: "CHECK_COMPLAINT",
      label: "Menganalisis kelengkapan informasi & aturan persona",
    },
  });

  await delay(300);
  if (abortSignal?.aborted) throw new Error("Aborted");
  onEvent({
    event: "step.completed",
    data: {
      runId,
      seq: seq++,
      toolCallId: "call-check",
      step: "CHECK_COMPLAINT",
      label: "Analisis kelengkapan selesai",
    },
  });

  // Step 3: PREPARE_DRAFT
  await delay(200);
  if (abortSignal?.aborted) throw new Error("Aborted");
  onEvent({
    event: "step.started",
    data: {
      runId,
      seq: seq++,
      toolCallId: "call-draft",
      step: "PREPARE_DRAFT",
      label: "Menyusun draft laporan resmi",
    },
  });

  // Analyze text
  const analysis = analyzeMessageCategory(userMessage);
  const detectedPhone = extractPhoneFromText(userMessage) || (currentDraft?.whatsapp ? currentDraft.whatsapp : "");

  let description = currentDraft?.description ? `${currentDraft.description} ${userMessage}` : userMessage;
  if (description.length > 300) {
    description = description.slice(0, 300) + "...";
  }

  const category = currentDraft?.category || analysis.category;
  const aiSummary = currentDraft?.aiSummary || analysis.summary;

  const missingFields: string[] = [];
  if (!detectedPhone || detectedPhone.length < 9) {
    missingFields.push("whatsapp");
  }
  if (!description || description.trim().length < 10) {
    missingFields.push("description");
  }

  const readyForConfirmation = missingFields.length === 0;

  const updatedDraft: ComplaintDraft = {
    description,
    category,
    aiSummary,
    whatsapp: detectedPhone,
  };

  await delay(250);
  if (abortSignal?.aborted) throw new Error("Aborted");
  onEvent({
    event: "step.completed",
    data: {
      runId,
      seq: seq++,
      toolCallId: "call-draft",
      step: "PREPARE_DRAFT",
      label: "Draft laporan berhasil diperbarui",
    },
  });

  // Reply text construction
  let fullReply = `${analysis.empathy} `;
  if (!detectedPhone) {
    fullReply += `\n\nUntuk menyusun laporan resmi yang dapat ditindaklanjuti, kami telah menyiapkan draft di samping. Mohon sertakan nomor WhatsApp aktif Anda agar sistem dapat mengirimkan notifikasi tiket dan pembaruan bukti kerja dari dinas terkait secara otomatis.`;
  } else if (!readyForConfirmation) {
    fullReply += `\n\nNomor WhatsApp Anda (${detectedPhone}) telah tercatat. Mohon jelaskan sedikit lebih detail lokasi atau kondisi yang diadukan agar laporan siap dikonfirmasi.`;
  } else {
    fullReply += `\n\nInformasi aduan dan nomor WhatsApp Anda (${detectedPhone}) sudah lengkap! Silakan tinjau ringkasan draft di sebelah kanan, lalu klik tombol "Konfirmasi & Kirim Laporan" untuk menerbitkan tiket resmi Anda.`;
  }

  // Stream reply.delta
  const words = fullReply.split(" ");
  for (let i = 0; i < words.length; i++) {
    if (abortSignal?.aborted) throw new Error("Aborted");
    const deltaText = words[i] + (i < words.length - 1 ? " " : "");
    onEvent({
      event: "reply.delta",
      data: {
        runId,
        seq: seq++,
        text: deltaText,
      },
    });
    await delay(25);
  }

  // Draft updated event
  onEvent({
    event: "draft.updated",
    data: {
      runId,
      seq: seq++,
      draft: updatedDraft,
      readyForConfirmation,
      missingFields,
    },
  });

  // Done event
  onEvent({
    event: "done",
    data: {
      runId,
      seq: seq++,
      reply: fullReply,
      draft: updatedDraft,
      readyForConfirmation,
      missingFields,
    },
  });

  return {
    reply: fullReply,
    draft: updatedDraft,
    readyForConfirmation,
    missingFields,
  };
}

