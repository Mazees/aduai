"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import { RotateCcw, Send, Square } from "lucide-react";
import { readSse } from "@/lib/ai/sse";
import type { ChatMessage, ChatStreamEvent } from "@/types/chat";
import type { ComplaintDraft, SubmissionReceipt } from "@/types/complaint";
import ChatBubble from "./ChatBubble";
import TicketSuccessScreen from "./TicketSuccessScreen";

const KEY = "aduai.chat.v1";
const initial: ChatMessage[] = [{ role: "assistant", content: "Halo! Saya Asisten AduAI. Ceritakan masalah di sekitar Anda, saya akan membantu menyusun aduan dan memberikan masukan yang relevan." }];
type Pending = { messages: ChatMessage[]; draft: ComplaintDraft | null; confirmed: boolean; key: string };
type Saved = { messages: ChatMessage[]; draft: ComplaintDraft | null; ready: boolean; sessionId: string; pending: Pending | null; receipt: SubmissionReceipt | null };

export default function ChatContainer() {
  const searchParams = useSearchParams();
  const [messages, setMessages] = useState<ChatMessage[]>(initial);
  const [draft, setDraft] = useState<ComplaintDraft | null>(null);
  const [ready, setReady] = useState(false);
  const [sessionId, setSessionId] = useState("");
  const [pending, setPending] = useState<Pending | null>(null);
  const [receipt, setReceipt] = useState<SubmissionReceipt | null>(null);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const generation = useRef(0);
  const bottom = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void Promise.resolve().then(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const saved = JSON.parse(raw) as Saved;
        if (Array.isArray(saved.messages) && saved.sessionId) {
          setMessages(saved.messages); setDraft(saved.draft); setReady(saved.ready); setSessionId(saved.sessionId); setPending(saved.pending); setReceipt(saved.receipt); if (saved.pending && !saved.receipt) setError("Proses sebelumnya belum selesai. Coba lagi.");
        } else setSessionId(crypto.randomUUID());
      } else setSessionId(crypto.randomUUID());
    } catch { setSessionId(crypto.randomUUID()); }
    setHydrated(true);
    });
  }, []);
  useEffect(() => {
    if (!hydrated || !sessionId) return;
    try { localStorage.setItem(KEY, JSON.stringify({ messages: messages.filter((m) => m.content.trim()), draft, ready, sessionId, pending, receipt })); } catch { /* Browser storage is optional. */ }
  }, [messages, draft, ready, sessionId, pending, receipt, hydrated]);
  useEffect(() => { bottom.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, label]);
  useEffect(() => () => abortRef.current?.abort(), []);

  const run = useCallback(async (request: Pending, currentSession: string) => {
    const runGeneration = generation.current;
    const controller = new AbortController(); abortRef.current = controller;
    setPending(request); setError(null); setLoading(true); setLabel("Menyiapkan jawaban...");
    setMessages([...request.messages, { role: "assistant", content: "" }]);
    let finished = false, created = false;
    try {
      const response = await fetch("/api/chat", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": request.key },
        body: JSON.stringify({ messages: request.messages, draft: request.draft, sessionId: currentSession, confirmed: request.confirmed }), signal: controller.signal });
      if (!response.ok) { const body = await response.json().catch(() => null); throw new Error(body?.error?.message || "Layanan AI belum tersedia."); }
      if (!response.body) throw new Error("Jawaban AI tidak tersedia.");
      for await (const frame of readSse(response.body)) {
        const event = { event: frame.event, data: JSON.parse(frame.data) } as ChatStreamEvent;
        if (event.event === "step.started") setLabel(event.data.label);
        else if (event.event === "step.completed" || event.event === "step.failed") setLabel("Menyiapkan jawaban...");
        else if (event.event === "reply.delta") setMessages((prev) => { const last = prev.at(-1); return last?.role === "assistant" ? [...prev.slice(0, -1), { ...last, content: last.content + event.data.text }] : prev; });
        else if (event.event === "draft.updated") { setDraft(event.data.draft); setReady(event.data.readyForConfirmation); }
        else if (event.event === "complaint.created") { created = true; setReceipt(event.data.submission); setPending(null); }
        else if (event.event === "done") { finished = true; setDraft(event.data.draft); setReady(event.data.readyForConfirmation); setPending(null); setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: event.data.reply }]); }
        else if (event.event === "error") throw new Error(event.data.message || "Terjadi kesalahan saat memproses aduan.");
      }
      if (!finished && !created) throw new Error("Koneksi terputus sebelum jawaban selesai. Coba lagi.");
    } catch (cause) {
      if (!created && generation.current === runGeneration) { setMessages(request.messages); setError(controller.signal.aborted ? "Proses dihentikan. Anda dapat mencoba lagi." : cause instanceof Error ? cause.message : "Koneksi gagal. Coba lagi."); }
    } finally { if (generation.current === runGeneration) { abortRef.current = null; setLoading(false); setLabel(""); } }
  }, []);

  const send = (confirmed = false) => {
    if (loading || !sessionId || pending) return;
    const text = confirmed ? "Kirim aduan" : input.trim();
    if (!text) return;
    const history: ChatMessage[] = [...messages.filter((m) => m.content.trim()), { role: "user", content: text }];
    setInput(""); setMessages(history);
    void run({ messages: history, draft, confirmed, key: crypto.randomUUID() }, sessionId);
  };
  const reset = () => { generation.current += 1; abortRef.current?.abort(); setLoading(false); setLabel(""); localStorage.removeItem(KEY); setMessages(initial); setDraft(null); setReady(false); setPending(null); setReceipt(null); setError(null); setInput(""); setSessionId(crypto.randomUUID()); };
  const initialText = searchParams.get("initial");
  useEffect(() => { if (hydrated && initialText) void Promise.resolve().then(() => setInput((value) => value || initialText)); }, [hydrated, initialText]);

  if (receipt) return <TicketSuccessScreen ticketNumber={receipt.ticketNumber} onNewChat={reset} />;
  return <div className="citizen-chat-page"><div className="citizen-chat-inner"><div className="citizen-chat-window flex flex-col bg-white overflow-hidden">
    <div className="bg-white px-4 py-3 flex items-center justify-between border-b border-dark"><div className="flex items-center gap-3"><Image src="/icon.png" alt="" width={44} height={44} /><h2 className="font-bold text-sm text-primary">Asisten AduAI</h2></div><button type="button" onClick={reset} className="inline-flex items-center gap-1 text-sm text-primary"><RotateCcw size={15} /> Mulai baru</button></div>
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 wa-chat-bg space-y-2">{messages.filter((m) => m.content || !loading).map((message, index) => <ChatBubble key={index} message={message} isStreaming={loading && index === messages.length - 1 && message.role === "assistant"} />)}
      {loading && <div role="status" className="inline-block rounded-full bg-white px-3 py-2 text-xs text-slate-600">{label}</div>}
      {error && <div role="alert" className="rounded-lg bg-white p-3 text-sm text-rose-700">{error} {pending && <button type="button" onClick={() => void run(pending, sessionId)} className="font-semibold underline">Coba lagi</button>}</div>}
      <div ref={bottom} />
    </div>
    {ready && !pending && <div className="flex items-center justify-between gap-3 border-t border-slate-200 bg-white p-3 text-sm"><span>Periksa isi aduan sebelum mengirim.</span><button type="button" disabled={loading} onClick={() => send(true)} className="button-primary">Kirim aduan</button></div>}
    <form onSubmit={(event) => { event.preventDefault(); send(); }} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2"><textarea rows={1} value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); send(); } }} disabled={loading || !!pending} placeholder="Ceritakan kendala di sekitar Anda..." className="flex-1 rounded-xl border border-slate-200 p-3 text-sm resize-none outline-none focus:border-primary" />
      {loading ? <button type="button" onClick={() => abortRef.current?.abort()} aria-label="Hentikan" className="rounded-xl bg-primary p-3 text-white"><Square size={17} /></button> : <button type="submit" disabled={!input.trim() || !!pending} aria-label="Kirim" className="rounded-xl bg-primary p-3 text-white disabled:opacity-40"><Send size={17} /></button>}
    </form>
  </div></div></div>;
}
