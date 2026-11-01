"use client";

import React from "react";
import { Loader2 } from "lucide-react";
import { AgentProcessStep } from "@/lib/mock-ai-engine";

interface ProcessPanelProps {
  steps: AgentProcessStep[];
  isRunning: boolean;
}

export default function ProcessPanel({ steps, isRunning }: ProcessPanelProps) {
  if (!isRunning) return null;
  const activeStep = steps.find((step) => step.status === "running");
  const label = activeStep?.label ?? "Menyiapkan jawaban...";

  return (
    <div className="my-2" role="status" aria-live="polite" aria-atomic="true">
      <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-2 text-xs text-slate-600 shadow-2xs">
        <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" aria-hidden="true" />
        {label}
      </span>
    </div>
  );
}
