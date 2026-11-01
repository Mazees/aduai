"use client";

import React from "react";
import { CheckCheck, User, FileImage, FileText } from "lucide-react";
import { ChatMessage } from "@/types/chat";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

interface ChatBubbleProps {
  message: ChatMessage;
  isStreaming?: boolean;
  timestamp?: string;
}

export default function ChatBubble({
  message,
  isStreaming = false,
  timestamp,
}: ChatBubbleProps) {
  const isUser = message.role === "user";
  const displayTime = timestamp || "Baru saja";

  return (
    <div
      className={`flex w-full my-2.5 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex items-end max-w-[90%] sm:max-w-[78%] gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      >
        {/* Avatar */}
        <div className="size-10 p-1 rounded-full shrink-0 flex items-center justify-center text-xs shadow-xs relative bg-primary text-white">
          {isUser ? (
            <User className="w-4 h-4" />
          ) : (
            <Image
              src="/icon_light.png"
              alt="AduAI"
              width={78}
              height={78}
              className="block h-full w-full object-contain"
            />
          )}
          {!isUser && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-secondary border-2 border-white ring-1 ring-emerald-500/20" />
          )}
        </div>

        {/* Bubble Box */}
        <div
          className={`relative px-4 py-2.5 rounded-2xl shadow-xs text-sm sm:text-[14px] leading-relaxed transition-all space-y-2 ${
            isUser
              ? "bg-bubble-user text-[var(--ink)] rounded-br-xs border border-emerald-300/40"
              : "bg-white text-[var(--ink)] rounded-bl-xs border border-slate-200/90 shadow-2xs"
          }`}
        >
          {/* Header role if assistant */}
          {!isUser && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-primary">AduAI</span>
            </div>
          )}

          {/* Attachments preview if user uploaded any */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="space-y-1.5 pt-0.5">
              {message.attachments.map((att, i) => {
                const isImage =
                  att.type.includes("image") ||
                  att.name.match(/\.(jpg|jpeg|png|webp)$/i);
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 p-2 rounded-xl bg-black/5 border border-black/10 text-xs"
                  >
                    {isImage ? (
                      <FileImage className="w-4 h-4 text-emerald-800 shrink-0" />
                    ) : (
                      <FileText className="w-4 h-4 text-emerald-800 shrink-0" />
                    )}
                    <span className="font-mono text-[11px] text-slate-800 truncate font-semibold">
                      {att.name}
                    </span>
                    <span className="ml-auto text-[10px] text-emerald-900 bg-emerald-200/60 px-1.5 py-0.5 rounded font-mono">
                      Lampiran
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Text Content */}
          <div className="break-words text-slate-900">
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.content}</div>
            ) : (
              <div className="space-y-2">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkBreaks]}
                  skipHtml
                  components={{
                    p: ({ children }) => <p>{children}</p>,
                    ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    h1: ({ children }) => <h3 className="font-bold">{children}</h3>,
                    h2: ({ children }) => <h3 className="font-bold">{children}</h3>,
                    h3: ({ children }) => <h3 className="font-semibold">{children}</h3>,
                    a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">{children}</a>,
                    blockquote: ({ children }) => <blockquote className="border-l-2 border-primary/40 pl-3 text-slate-600">{children}</blockquote>,
                    pre: ({ children }) => <pre className="overflow-x-auto rounded-lg bg-slate-100 p-3 text-xs">{children}</pre>,
                    table: ({ children }) => <div className="overflow-x-auto"><table className="w-full text-left text-sm">{children}</table></div>,
                    th: ({ children }) => <th className="border border-slate-200 px-2 py-1 font-semibold">{children}</th>,
                    td: ({ children }) => <td className="border border-slate-200 px-2 py-1">{children}</td>,
                  }}
                >{message.content}</ReactMarkdown>
              </div>
            )}
            {isStreaming && (
              <span className="inline-block w-1.5 h-4 ml-1 bg-primary animate-blink align-middle" />
            )}
          </div>

          {/* Footer Metadata (time & read ticks) */}
          <div
            className={`flex items-center gap-1 justify-end pt-1 text-[10px] select-none ${isUser ? "text-emerald-800" : "text-slate-400"}`}
          >
            <span>{displayTime}</span>
            {isUser && <CheckCheck className="w-3.5 h-3.5 text-secondary" />}
          </div>
        </div>
      </div>
    </div>
  );
}
