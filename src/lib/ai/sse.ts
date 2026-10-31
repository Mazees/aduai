// Parser bersama: satu frame SSE bisa terbelah di beberapa potongan jaringan.
export async function* readSse(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  try {
    while (true) {
      const part = await reader.read();
      buffer += decoder.decode(part.value, { stream: !part.done });
      buffer = buffer.replace(/\r\n/g, "\n");
      if (buffer.length > 2_000_000) throw new Error("STREAM_TOO_LARGE");
      let end: number;
      while ((end = buffer.indexOf("\n\n")) >= 0) {
        const frame = buffer.slice(0, end);
        buffer = buffer.slice(end + 2);
        const lines = frame.split("\n");
        const data = lines.filter((line) => line.startsWith("data:")).map((line) => line.slice(5).trimStart()).join("\n");
        if (data) yield { event: lines.find((line) => line.startsWith("event:"))?.slice(6).trim() ?? "message", data };
      }
      if (part.done) break;
    }
    if (buffer.trim()) throw new Error("STREAM_INCOMPLETE");
  } finally {
    await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}

