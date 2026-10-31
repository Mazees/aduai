import type { ComplaintDraft, SubmissionReceipt } from "./complaint";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRequest {
  messages: ChatMessage[];
  draft?: ComplaintDraft | null;
  sessionId?: string;
  confirmed?: boolean;
}

export type AgentStep =
  | "UNDERSTAND_CONTEXT"
  | "CHECK_COMPLAINT"
  | "PREPARE_DRAFT"
  | "CHECK_STATUS"
  | "SEARCH_KNOWLEDGE"
  | "SUBMIT_COMPLAINT";

type StreamBase = { runId: string; seq: number };
type DraftState = {
  draft: ComplaintDraft | null;
  readyForConfirmation: boolean;
  missingFields: string[];
};

export type ChatStreamEvent =
  | { event: "run.started"; data: StreamBase & { startedAt: string } }
  | {
      event: "step.started" | "step.completed";
      data: StreamBase & { toolCallId: string; step: AgentStep; label: string };
    }
  | {
      event: "step.failed";
      data: StreamBase & {
        toolCallId: string;
        step: AgentStep;
        label: string;
        retryable: boolean;
      };
    }
  | { event: "complaint.created"; data: StreamBase & { submission: SubmissionReceipt } }
  | { event: "reply.delta"; data: StreamBase & { text: string } }
  | { event: "draft.updated"; data: StreamBase & DraftState }
  | { event: "done"; data: StreamBase & DraftState & { reply: string; submission?: SubmissionReceipt; sources?: { title: string; url: string | null }[] } }
  | {
      event: "error";
      data: StreamBase & { code: string; message: string; retryable: boolean };
    };
