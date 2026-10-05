import { streamChat, type ChatMessage } from "@/lib/ai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { messages?: ChatMessage[] } | null;
  const messages = body?.messages?.filter((m) => typeof m.content === "string" && m.content.trim()) ?? [];
  if (messages.length === 0) {
    return Response.json({ error: "messages[] is required" }, { status: 400 });
  }
  try {
    const stream = await streamChat(messages.slice(-12)); // cap context sent upstream
    return new Response(stream, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 502 });
  }
}
