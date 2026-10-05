"use client";

import { useState } from "react";

type Msg = { role: "user" | "assistant"; content: string };

export default function Home() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!input.trim() || busy) return;
    const next: Msg[] = [...messages, { role: "user", content: input.trim() }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setInput("");
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) throw new Error((await res.json()).error ?? res.statusText);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        const token = decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: copy[copy.length - 1].content + token };
          return copy;
        });
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main>
      <h1>Next.js + AI: streaming chat</h1>
      <p>The API key stays on the server (Route Handler); the browser only sees streamed text.</p>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {messages.map((m, i) => (
          <li key={i} style={{ margin: "0.5rem 0", whiteSpace: "pre-wrap" }}>
            <strong>{m.role === "user" ? "You" : "AI"}:</strong> {m.content}
          </li>
        ))}
      </ul>
      {error && <p style={{ color: "crimson" }}>Error: {error}</p>}
      <form onSubmit={send} style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask how to add AI to a Next.js app…"
          style={{ flex: 1, padding: 8 }}
        />
        <button disabled={busy}>{busy ? "Streaming…" : "Send"}</button>
      </form>
    </main>
  );
}
