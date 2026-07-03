import { NextResponse } from "next/server";
import type { ChatRequestMessage } from "@/types/chat";

interface ChatRequestBody {
  messages?: ChatRequestMessage[];
  systemContext?: string;
}

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";

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
        messages: [
          {
            role: "system",
            content: systemContext,
          },
          ...incomingMessages,
        ],
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.error?.message ?? "OpenRouter request failed." },
        { status: response.status }
      );
    }

    const assistantMessage = payload?.choices?.[0]?.message?.content;

    if (!assistantMessage) {
      return NextResponse.json(
        { error: "No assistant response returned by provider." },
        { status: 502 }
      );
    }

    return NextResponse.json({ message: assistantMessage });
  } catch {
    return NextResponse.json(
      { error: "Unable to process chat request." },
      { status: 500 }
    );
  }
}
