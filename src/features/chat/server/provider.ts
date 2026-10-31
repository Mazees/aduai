import "server-only";
import { readSse } from "@/lib/ai/sse";

export type ProviderConfig = { endpoint: string; model: string; apiKey: string };
export type ToolCall = { id: string; type: "function"; function: { name: string; arguments: string } };
export type ModelMessage =
  | { role: "system" | "user"; content: string }
  | { role: "assistant"; content: string | null; tool_calls?: ToolCall[] }
  | { role: "tool"; tool_call_id: string; content: string };
export type ToolDefinition = { type: "function"; function: { name: string; description: string; parameters: Record<string, unknown> } };
export type ModelResult = { content: string | null; toolCalls: ToolCall[] };
export type Completion = (messages: ModelMessage[], tools: ToolDefinition[], signal?: AbortSignal, onText?: (text: string) => void) => Promise<ModelResult>;

// Backend memasukkan konfigurasi server. Adapter ini tidak membaca file atau database.
export async function completeWithConfig(
  config: ProviderConfig, messages: ModelMessage[], tools: ToolDefinition[],
  signal?: AbortSignal, onText?: (text: string) => void, transport: typeof fetch = fetch,
): Promise<ModelResult> {
  if (!config.apiKey || !config.model) throw new Error("AI_NOT_CONFIGURED");
  const url = new URL(config.endpoint);
  if ((url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && url.protocol === "http:" &&
      ["localhost", "127.0.0.1"].includes(url.hostname))) || url.username || url.password || url.hash) {
    throw new Error("AI_INVALID_ENDPOINT");
  }
  const timeout = AbortSignal.timeout(90_000);
  const response = await transport(url, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + config.apiKey },
    body: JSON.stringify({ model: config.model, messages, stream: true, ...(tools.length ? { tools, tool_choice: "auto" } : {}) }),
    cache: "no-store", redirect: "error", signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
  });
  // Body error provider tidak diteruskan karena dapat berisi detail sensitif.
  if (!response.ok || !response.body) throw new Error("AI_PROVIDER_ERROR");
  if (!response.headers.get("content-type")?.includes("text/event-stream")) throw new Error("AI_STREAM_UNSUPPORTED");
  let content = "";
  let finished = false;
  const calls = new Map<number, ToolCall>();
  for await (const frame of readSse(response.body)) {
    if (frame.data === "[DONE]") break;
    const json = JSON.parse(frame.data);
    if (json.error) throw new Error("AI_PROVIDER_ERROR");
    const choice = json.choices?.[0];
    if (!choice) continue; // Sebagian provider mengirim frame usage tanpa choices.
    const delta = choice.delta;
    if (!delta || typeof delta !== "object") throw new Error("AI_INVALID_RESPONSE");
    if (typeof delta.content === "string") {
      content += delta.content;
      if (content.length > 24_000) throw new Error("AI_OUTPUT_LIMIT");
      onText?.(delta.content);
    }
    for (const part of delta.tool_calls ?? []) {
      if (!Number.isInteger(part.index) || part.index < 0 || part.index >= 8) throw new Error("AI_INVALID_TOOL_CALL");
      const call = calls.get(part.index) ?? { id: "", type: "function" as const, function: { name: "", arguments: "" } };
      if (typeof part.id === "string") call.id += part.id;
      if (typeof part.function?.name === "string") call.function.name += part.function.name;
      if (typeof part.function?.arguments === "string") call.function.arguments += part.function.arguments;
      if (call.function.arguments.length > 12_000) throw new Error("AI_TOOL_LIMIT");
      calls.set(part.index, call);
    }
    if (choice.finish_reason) {
      if (!["stop", "tool_calls"].includes(choice.finish_reason)) throw new Error("AI_INCOMPLETE_RESPONSE");
      finished = true;
    }
  }
  if (!finished) throw new Error("AI_INCOMPLETE_RESPONSE");
  const toolCalls = [...calls.entries()].sort(([a], [b]) => a - b).map(([, call]) => call);
  if (toolCalls.some((call) => !call.id || !call.function.name) ||
      new Set(toolCalls.map((call) => call.id)).size !== toolCalls.length) throw new Error("AI_INVALID_TOOL_CALL");
  return { content: content || null, toolCalls };
}

