"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { ChatMessage } from "@/types/chat";
import { Complaint, ComplaintDraft } from "@/types/complaint";
import {
  AgentProcessStep,
  simulateAgentResponse,
} from "@/lib/mock-ai-engine";
import { MockService } from "@/lib/mock-service";
import ChatBubble from "./ChatBubble";
import ProcessPanel from "./ProcessPanel";
import DraftCard from "./DraftCard";
import TicketSuccessModal from "./TicketSuccessModal";
import {
  Send,
  Square,
  MessageSquare,
  Paperclip,
  RotateCcw,
  Image as ImageIcon,
  FileText,
  FileCheck2,
} from "lucide-react";

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    role: "assistant",
    content: "Halo! Saya Asisten AduAI. Ada fasilitas publik yang rusak, jalan berlubang, lampu padam, atau masalah kebersihan di sekitar Anda? Ceritakan dengan santai seperti berkirim pesan biasa. Saya akan membantu merapikannya menjadi draft laporan resmi untuk dinas terkait.",
  },
];

const QUICK_PROMPTS = [
  "Jalan berlubang dekat SDN 01 Rawamangun, rawan kecelakaan",
  "Lampu PJU padam sepanjang 300 meter di Jl. Merpati",
  "Tumpukan sampah liar menutupi trotoar jembatan pasar",
  "Saluran got tersumbat lumpur di RT 04, air meluap",
];

const SAMPLE_ATTACHMENTS = [
  { name: "foto_jalan_berlubang.jpg", type: "image/jpeg" },
  { name: "foto_lampu_padam.jpg", type: "image/jpeg" },
  { name: "laporan_rt04_surat.pdf", type: "application/pdf" },
];

export default function ChatContainer() {
  const searchParams = useSearchParams();
  const initialText = searchParams.get("initial");

  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [processSteps, setProcessSteps] = useState<AgentProcessStep[]>([]);
  const [draft, setDraft] = useState<ComplaintDraft | null>(null);
  const [readyForConfirmation, setReadyForConfirmation] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>(["whatsapp", "description"]);
  const [createdComplaint, setCreatedComplaint] = useState<Complaint | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mobileTab, setMobileTab] = useState<"chat" | "draft">("chat");

  // Attachments state
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState<
    { name: string; type: string }[]
  >([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);
  const initialHandledRef = useRef(false);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, processSteps, isStreaming]);

  const handleStopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsStreaming(false);
    }
  }, []);

  const handleSendMessage = useCallback(
    async (textToSend?: string) => {
      const text = textToSend !== undefined ? textToSend : inputText;
      if ((!text.trim() && selectedAttachments.length === 0) || isStreaming) return;

      setInputText("");
      const attachmentsToPass = [...selectedAttachments];
      setSelectedAttachments([]);

      const userMsg: ChatMessage = {
        role: "user",
        content: text.trim() || "(Mengirimkan lampiran berkas)",
        attachments: attachmentsToPass.length > 0 ? attachmentsToPass : undefined,
      };
      const newHistory = [...messages, userMsg];
      setMessages(newHistory);
      setIsStreaming(true);

      const steps: AgentProcessStep[] = [
        {
          toolCallId: "call-understand",
          step: "UNDERSTAND_CONTEXT",
          label: "Memahami kronologi aduan warga",
          status: "pending",
        },
        {
          toolCallId: "call-check",
          step: "CHECK_COMPLAINT",
          label: "Menganalisis kelengkapan detail",
          status: "pending",
        },
        {
          toolCallId: "call-draft",
          step: "PREPARE_DRAFT",
          label: "Menyusun draf resmi dinas",
          status: "pending",
        },
      ];
      setProcessSteps(steps);

      // Placeholder assistant message for streaming
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      try {
        await simulateAgentResponse(
          text.trim(),
          newHistory,
          draft,
          (event) => {
            if (event.event === "step.started") {
              setProcessSteps((prev) =>
                prev.map((s) =>
                  s.toolCallId === event.data.toolCallId ? { ...s, status: "running" } : s
                )
              );
            } else if (event.event === "step.completed") {
              setProcessSteps((prev) =>
                prev.map((s) =>
                  s.toolCallId === event.data.toolCallId ? { ...s, status: "completed" } : s
                )
              );
            } else if (event.event === "reply.delta") {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.role === "assistant") {
                  return [
                    ...prev.slice(0, -1),
                    { ...last, content: last.content + event.data.text },
                  ];
                }
                return prev;
              });
            } else if (event.event === "draft.updated") {
              if (event.data.draft) {
                setDraft(event.data.draft);
              }
              setReadyForConfirmation(event.data.readyForConfirmation);
              setMissingFields(event.data.missingFields);
            } else if (event.event === "done") {
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last && last.role === "assistant") {
                  return [...prev.slice(0, -1), { ...last, content: event.data.reply }];
                }
                return prev;
              });
              if (event.data.draft) {
                setDraft(event.data.draft);
              }
              setReadyForConfirmation(event.data.readyForConfirmation);
              setMissingFields(event.data.missingFields);
            }
          },
          abortController.signal
        );
      } catch {
        // Aborted
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [draft, inputText, isStreaming, messages, selectedAttachments]
  );

  // Handle URL initial message if present
  useEffect(() => {
    if (initialText && !initialHandledRef.current) {
      initialHandledRef.current = true;
      void handleSendMessage(initialText);
    }
  }, [initialText, handleSendMessage]);

  const handleResetChat = () => {
    if (isStreaming) handleStopStream();
    setMessages(INITIAL_MESSAGES);
    setDraft(null);
    setProcessSteps([]);
    setReadyForConfirmation(false);
    setSelectedAttachments([]);
  };

  const handleAddAttachment = (att: { name: string; type: string }) => {
    if (!selectedAttachments.some((a) => a.name === att.name)) {
      setSelectedAttachments((prev) => [...prev, att]);
    }
    setShowAttachmentMenu(false);
  };

  const handleRemoveAttachment = (name: string) => {
    setSelectedAttachments((prev) => prev.filter((a) => a.name !== name));
  };

  const handleConfirmSubmit = () => {
    if (!draft) return;
    setIsSubmitting(true);
    setTimeout(() => {
      const created = MockService.createComplaint(draft, messages);
      setCreatedComplaint(created);
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden bg-slate-200/90 p-1 rounded-xl mb-3 text-xs font-bold">
        <button
          onClick={() => setMobileTab("chat")}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === "chat" ? "bg-white text-[#075e54] shadow-xs" : "text-slate-600"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Percakapan AI</span>
        </button>
        <button
          onClick={() => setMobileTab("draft")}
          className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
            mobileTab === "draft" ? "bg-white text-[#075e54] shadow-xs" : "text-slate-600"
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          <span>Draf Aduan</span>
          {draft && <span className="w-2 h-2 rounded-full bg-[#25d366]" />}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Chat Column */}
        <div
          className={`lg:col-span-7 xl:col-span-8 flex flex-col bg-white rounded-2xl border border-slate-300/80 shadow-md overflow-hidden ${
            mobileTab === "draft" ? "hidden lg:flex" : "flex"
          }`}
          style={{ height: "calc(100vh - 140px)", minHeight: "560px" }}
        >
          {/* Authentic WhatsApp Style Header Bar */}
          <div className="bg-[#075e54] text-white px-4 py-3 flex items-center justify-between border-b border-[#054a42]">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center font-bold text-sm text-white shadow-2xs border border-white/20">
                AI
              </div>
              <div>
                <h2 className="font-bold text-xs sm:text-sm text-white leading-tight">
                  Asisten Pengaduan Warga
                </h2>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-[#25d366] animate-pulse" />
                  <span>Online • Respons Otomatis</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleResetChat}
                className="inline-flex items-center gap-1 text-[11px] text-emerald-100 hover:text-white bg-white/10 hover:bg-white/15 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                title="Mulai Percakapan Baru"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden sm:inline">Mulai Baru</span>
              </button>

              <span className="text-[10px] text-emerald-200/80 font-mono hidden md:inline px-2 py-0.5 rounded bg-emerald-950/40">
                100% Anonim
              </span>
            </div>
          </div>

          {/* Chat Messages Body with WhatsApp background */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 wa-chat-bg space-y-2">
            {messages.map((msg, idx) => (
              <ChatBubble
                key={idx}
                message={msg}
                isStreaming={isStreaming && idx === messages.length - 1 && msg.role === "assistant"}
              />
            ))}

            {/* AI Process steps */}
            {processSteps.length > 0 && (
              <ProcessPanel steps={processSteps} isRunning={isStreaming} />
            )}

            <div ref={chatBottomRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div className="px-3.5 py-2 bg-slate-50 border-t border-slate-200/90 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
            <span className="text-[10px] text-slate-400 shrink-0 font-bold uppercase tracking-wider">
              Saran Cepat:
            </span>
            {QUICK_PROMPTS.map((prompt, i) => (
              <button
                key={i}
                disabled={isStreaming}
                onClick={() => handleSendMessage(prompt)}
                className="shrink-0 text-[11px] bg-white hover:bg-emerald-50 text-slate-700 hover:text-[#075e54] px-2.5 py-1 rounded-lg border border-slate-200 hover:border-emerald-300 transition-colors disabled:opacity-50 font-medium cursor-pointer"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Attachment Tray (if files selected) */}
          {selectedAttachments.length > 0 && (
            <div className="px-3 py-1.5 bg-emerald-50/80 border-t border-emerald-200 flex items-center gap-2 overflow-x-auto">
              <span className="text-[10px] text-emerald-800 font-bold shrink-0">Lampiran:</span>
              {selectedAttachments.map((att, i) => (
                <div
                  key={i}
                  className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-white border border-emerald-300 text-[11px] text-slate-800 font-mono"
                >
                  <Paperclip className="w-3 h-3 text-[#008069]" />
                  <span>{att.name}</span>
                  <button
                    onClick={() => handleRemoveAttachment(att.name)}
                    className="text-slate-400 hover:text-rose-500 font-bold ml-1 cursor-pointer"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Chat Input Bar */}
          <div className="p-3 bg-white border-t border-slate-200 relative">
            {/* Attachment popover */}
            {showAttachmentMenu && (
              <div className="absolute bottom-16 left-4 z-20 bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 space-y-1 w-64 animate-in slide-in-from-bottom-2 duration-150">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 px-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Pilih Contoh Bukti
                  </span>
                  <button
                    onClick={() => setShowAttachmentMenu(false)}
                    className="text-xs text-slate-400 hover:text-slate-700 font-bold"
                  >
                    ×
                  </button>
                </div>
                {SAMPLE_ATTACHMENTS.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleAddAttachment(item)}
                    className="w-full flex items-center gap-2.5 p-2 rounded-xl hover:bg-emerald-50 text-left text-xs font-medium text-slate-700 transition-colors cursor-pointer"
                  >
                    {item.type.includes("image") ? (
                      <ImageIcon className="w-4 h-4 text-[#008069]" />
                    ) : (
                      <FileText className="w-4 h-4 text-[#008069]" />
                    )}
                    <span className="truncate font-mono text-[11px]">{item.name}</span>
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Paperclip attachment button */}
              <button
                type="button"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className={`p-2.5 rounded-xl border transition-colors cursor-pointer ${
                  selectedAttachments.length > 0 || showAttachmentMenu
                    ? "bg-emerald-100 text-[#075e54] border-emerald-300"
                    : "bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-200"
                }`}
                title="Sisipkan bukti foto/dokumen"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              <textarea
                rows={1}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={isStreaming}
                placeholder="Ceritakan kendala fasilitas di sekitar Anda..."
                className="flex-1 py-2.5 px-3.5 text-xs bg-slate-50 focus:bg-white rounded-xl border border-slate-200 focus:border-[#008069] focus:ring-1 focus:ring-[#008069]/30 outline-none resize-none max-h-24 text-slate-800 leading-relaxed font-normal"
              />

              {isStreaming ? (
                <button
                  type="button"
                  onClick={handleStopStream}
                  className="p-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                  title="Hentikan Penulisan"
                >
                  <Square className="w-4 h-4 fill-current" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!inputText.trim() && selectedAttachments.length === 0}
                  className="p-2.5 rounded-xl bg-[#008069] hover:bg-[#075e54] text-white disabled:bg-slate-200 disabled:text-slate-400 transition-colors cursor-pointer shadow-xs active:scale-95"
                  title="Kirim Pesan"
                >
                  <Send className="w-4 h-4 stroke-[2]" />
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Live Draft Column */}
        <div
          className={`lg:col-span-5 xl:col-span-4 sticky top-20 ${
            mobileTab === "chat" ? "hidden lg:block" : "block"
          }`}
        >
          <DraftCard
            draft={draft}
            onUpdateDraft={setDraft}
            onConfirmSubmit={handleConfirmSubmit}
            readyForConfirmation={readyForConfirmation}
            missingFields={missingFields}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>

      {/* Ticket Success Modal */}
      {createdComplaint && (
        <TicketSuccessModal
          complaint={createdComplaint}
          onClose={() => setCreatedComplaint(null)}
        />
      )}
    </div>
  );
}
