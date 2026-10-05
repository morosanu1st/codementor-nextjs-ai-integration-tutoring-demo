# Next.js AI integration: tutoring demo

A small, working Next.js 14 (App Router, TypeScript) app that adds an AI chat feature the right way:
the model is called from a server Route Handler, the response is streamed, and the client renders tokens as they arrive.
It runs with no API key (a mock stream), and switches to any OpenAI-compatible API when you set `OPENAI_API_KEY`.

## Run it

```bash
npm install
cp .env.example .env.local   # optional: add OPENAI_API_KEY
npm run dev                  # http://localhost:3000
```

## What's inside

- `app/api/chat/route.ts` validates input, caps context, and returns a streamed text response.
- `lib/ai.ts` calls the chat completions API with `stream: true` and converts the SSE events into plain text tokens; it falls back to a mock stream offline.
- `app/page.tsx` is a client component that reads the stream with `fetch` and a `ReadableStream` reader.

## How I'd teach this (1:1 sessions)

1. **Next.js foundations**: App Router, server vs client components, Route Handlers, environment variables and why secrets never reach the browser.
2. **First AI call**: build this route together, then add streaming and error handling.
3. **Real features**: chat history, system prompts, structured JSON output, tool/function calling, and the Vercel AI SDK (`ai` package) as a higher-level option.
4. **Your project**: we apply it to your own app (RAG over your docs, rate limiting, cost control, deploying to Vercel).

Each session ends with working code in your repo and a short list of next steps.
