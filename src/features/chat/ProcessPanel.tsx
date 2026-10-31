"use client";

import React from "react";
import { Check, Loader2 } from "lucide-react";
import { AgentProcessStep } from "@/lib/mock-ai-engine";

interface ProcessPanelProps {
  steps: AgentProcessStep[];
  isRunning: boolean;
}

export default function ProcessPanel({ steps, isRunning }: ProcessPanelProps) {
  if (steps.length === 0 && !isRunning) return null;

  return (
    <div className="my-2 text-xs">
      <div className="inline-flex flex-wrap items-center gap-3 bg-white/90 border border-slate-200 rounded-lg px-3 py-1.5 shadow-2xs">
        <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
          Proses AI
        </span>
        {steps.map((step) => {
          return (
            <div key={step.toolCallId} className="flex items-center gap-1.5">
              {step.status === "running" ? (
                <Loader2 className="w-3 h-3 text-[#008069] animate-spin" />
              ) : step.status === "completed" ? (
                <Check className="w-3 h-3 text-emerald-600" />
              ) : (
                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
              )}
              <span
                className={`text-[11px] ${
                  step.status === "running"
                    ? "text-[#008069] font-medium"
                    : step.status === "completed"
                    ? "text-slate-700"
                    : "text-slate-400"
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
