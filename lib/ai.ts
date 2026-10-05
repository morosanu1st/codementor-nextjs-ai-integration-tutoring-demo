// Server-only helper: streams tokens from an OpenAI-compatible chat API.
// Falls back to a local mock stream so the demo runs without any API key.

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const SYSTEM_PROMPT =
  "You are a friendly coding tutor. Answer briefly and include a tiny code example when useful.";

export async function streamChat(messages: ChatMessage[]): Promise<ReadableStream<Uint8Array>> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return mockStream(messages);

  const res = await fetch(`${process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1"}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      stream: true,
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
    }),
  });
  if (!res.ok || !res.body) throw new Error(`Upstream error ${res.status}`);

  // Convert the upstream SSE ("data: {...}") into a plain text token stream for the client.
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  let buffer = "";
  return res.body.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buffer += decoder.decode(chunk, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const data = line.replace(/^data:\s*/, "").trim();
          if (!data || data === "[DONE]") continue;
          try {
            const token = JSON.parse(data).choices?.[0]?.delta?.content;
            if (token) controller.enqueue(encoder.encode(token));
          } catch {
            /* ignore keep-alive / partial lines */
          }
        }
      },
    })
  );
}

function mockStream(messages: ChatMessage[]): ReadableStream<Uint8Array> {
  const last = messages[messages.length - 1]?.content ?? "";
  const reply =
    `(mock mode, no API key set) You asked: "${last}". ` +
    "In Next.js, keep the API key on the server: call the model from a Route Handler " +
    "(app/api/chat/route.ts), stream the response, and read it on the client with fetch + a ReadableStream reader.";
  const encoder = new TextEncoder();
  const words = reply.split(" ");
  let i = 0;
  return new ReadableStream({
    async pull(controller) {
      if (i >= words.length) return controller.close();
      await new Promise((r) => setTimeout(r, 40));
      controller.enqueue(encoder.encode(words[i++] + " "));
    },
  });
}
