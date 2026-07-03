import { NextResponse } from "next/server";
import type { ChatRequestMessage } from "@/types/chat";

interface ChatRequestBody {
  messages?: ChatRequestMessage[];
  systemContext?: string;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

function extractDeltaText(data: string): string {
  try {
    const parsed = JSON.parse(data);
    return parsed?.choices?.[0]?.delta?.content ?? "";
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENROUTER_API_KEY is missing in environment variables." },
      { status: 500 }
    );
  }

  try {
    const body = (await request.json()) as ChatRequestBody;
    const incomingMessages = body.messages ?? [];
    const systemContext = body.systemContext?.trim();

    if (!systemContext) {
      return NextResponse.json(
        { error: "systemContext is required." },
        { status: 400 }
      );
    }

    if (incomingMessages.length === 0) {
      return NextResponse.json(
        { error: "messages must contain at least one entry." },
        { status: 400 }
      );
    }

    const model = process.env.OPENROUTER_MODEL ?? "openai/gpt-4o-mini";

    const response = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.OPENROUTER_SITE_URL ?? "http://localhost:3000",
        "X-Title": process.env.OPENROUTER_SITE_NAME ?? "Multi Chatbot Dashboard",
      },
      body: JSON.stringify({
        model,
        stream: true,
        messages: [
          {
            role: "system",
            content: systemContext,
          },
          ...incomingMessages,
        ],
      }),
      signal: request.signal,
    });

    if (!response.ok) {
      let message = "OpenRouter request failed.";
      try {
        const payload = await response.json();
        message = payload?.error?.message ?? message;
      } catch {
        // Keep the default message when the error body is not JSON.
      }
      return NextResponse.json({ error: message }, { status: response.status });
    }

    if (!response.body) {
      return NextResponse.json(
        { error: "No assistant response returned by provider." },
        { status: 502 }
      );
    }

    const upstream = response.body;
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        const reader = upstream.getReader();
        let buffer = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            let newlineIndex = buffer.indexOf("\n");
            while (newlineIndex !== -1) {
              const line = buffer.slice(0, newlineIndex).trim();
              buffer = buffer.slice(newlineIndex + 1);
              newlineIndex = buffer.indexOf("\n");

              if (!line.startsWith("data: ")) continue;

              const data = line.slice(6);
              if (data === "[DONE]") continue;

              const text = extractDeltaText(data);
              if (text) {
                controller.enqueue(encoder.encode(text));
              }
            }
          }
          controller.close();
        } catch (streamError) {
          controller.error(streamError);
        } finally {
          reader.releaseLock();
        }
      },
      cancel() {
        upstream.cancel().catch(() => {});
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return new Response(null, { status: 499 });
    }
    return NextResponse.json(
      { error: "Unable to process chat request." },
      { status: 500 }
    );
  }
}
