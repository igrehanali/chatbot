"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, Check, Copy, RefreshCcw, SendHorizonal, Square, Trash2 } from "lucide-react";
import { useChatbotsContext } from "@/components/providers/chatbots-provider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import type { ChatMessage } from "@/types/chat";

function createMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeMessageContent(content: string) {
  return content.replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trimEnd();
}

function CopyButton({
  text,
  className,
  label,
}: {
  text: string;
  className?: string;
  label: string;
}) {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setIsCopied(true);
      window.setTimeout(() => setIsCopied(false), 1500);
    } catch {
      setIsCopied(false);
    }
  };

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className={className}
      aria-label={label}
      onClick={handleCopy}
    >
      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
    </Button>
  );
}

function MessageContent({ content }: { content: string }) {
  const normalized = normalizeMessageContent(content);

  return (
    <div className="space-y-3 break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="whitespace-pre-wrap leading-7">{children}</p>,
          ul: ({ children }) => <ul className="ml-5 list-disc space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="ml-5 list-decimal space-y-1">{children}</ol>,
          li: ({ children }) => <li className="pl-1">{children}</li>,
          h1: ({ children }) => <h1 className="text-base font-semibold">{children}</h1>,
          h2: ({ children }) => <h2 className="text-[15px] font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold">{children}</h3>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-current/35 pl-3 text-current/90">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-current/20 bg-black/5 px-2 py-1 font-semibold">
              {children}
            </th>
          ),
          td: ({ children }) => <td className="border border-current/20 px-2 py-1">{children}</td>,
          code: ({ className, children, ...props }) => {
            const raw = String(children).replace(/\n$/, "");
            const isBlock = Boolean(className?.includes("language-"));

            if (!isBlock) {
              return (
                <code
                  className="rounded bg-black/10 px-1 py-0.5 font-mono text-[0.8em]"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <div className="relative my-2 overflow-hidden rounded-xl border border-current/20 bg-black/85 p-3 text-zinc-100">
                <CopyButton
                  text={raw}
                  label="Copy code block"
                  className="absolute right-2 top-2 h-7 w-7 text-zinc-200 hover:bg-white/10 hover:text-white"
                />
                <pre className="overflow-x-auto pr-9 text-xs leading-6">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </pre>
              </div>
            );
          },
        }}
      >
        {normalized}
      </ReactMarkdown>
    </div>
  );
}

export default function ChatPage() {
  const params = useParams<{ id: string }>();
  const botId = params.id;

  const {
    getBotById,
    getHistoryByBotId,
    appendMessage,
    updateMessageContent,
    replaceHistory,
  } = useChatbotsContext();
  const bot = getBotById(botId);
  const messages = useMemo(() => getHistoryByBotId(botId), [botId, getHistoryByBotId]);

  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "end",
    });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!isLoading) {
      textareaRef.current?.focus();
    }
  }, [isLoading]);

  const handleClearChat = () => {
    abortControllerRef.current?.abort();
    replaceHistory(botId, []);
    setError(null);
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
  };

  if (!bot) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-4">
        <div className="rounded-2xl border bg-card p-6 text-center">
          <h1 className="text-2xl font-semibold">Bot not found</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This chatbot may have been removed from local storage.
          </p>
          <Button asChild className="mt-4">
            <Link href="/">Back Home</Link>
          </Button>
        </div>
      </main>
    );
  }

  const requestAssistantResponse = async (
    outgoingMessages: { role: string; content: string }[]
  ) => {
    setError(null);
    setIsLoading(true);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    let assistantId: string | null = null;
    let accumulated = "";

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          systemContext: bot.systemContext,
          messages: outgoingMessages,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        let message = "Failed to fetch assistant response.";
        try {
          const payload = await response.json();
          message = payload?.error ?? message;
        } catch {
          // Keep the default message when the error body is not JSON.
        }
        throw new Error(message);
      }

      if (!response.body) {
        throw new Error("No assistant response returned by provider.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        accumulated += decoder.decode(value, { stream: true });

        if (!assistantId) {
          assistantId = createMessageId();
          appendMessage(botId, {
            id: assistantId,
            role: "assistant",
            content: accumulated,
            createdAt: new Date().toISOString(),
          });
        } else {
          updateMessageContent(botId, assistantId, accumulated);
        }
      }

      if (!assistantId) {
        throw new Error("No assistant response returned by provider.");
      }
    } catch (fetchError) {
      if (fetchError instanceof Error && fetchError.name === "AbortError") {
        // Keep whatever partial content was streamed before the stop.
      } else {
        setError(
          fetchError instanceof Error
            ? fetchError.message
            : "Something went wrong while contacting OpenRouter."
        );
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      setIsLoading(false);
    }
  };

  const handleSend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const userText = input.trim();
    if (!userText || isLoading) return;

    const userMessage: ChatMessage = {
      id: createMessageId(),
      role: "user",
      content: userText,
      createdAt: new Date().toISOString(),
    };

    const outgoingMessages = [...messages, userMessage].map(
      ({ role, content }) => ({ role, content })
    );

    appendMessage(botId, userMessage);
    setInput("");

    await requestAssistantResponse(outgoingMessages);
  };

  const handleRetry = async () => {
    if (isLoading || messages.length === 0) return;
    const outgoingMessages = messages.map(({ role, content }) => ({
      role,
      content,
    }));
    await requestAssistantResponse(outgoingMessages);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-3 py-4 sm:px-6 sm:py-6">
      <header className="animate-fade-up mb-3 flex items-center justify-between gap-3 rounded-2xl border bg-card/90 p-3 backdrop-blur-sm sm:mb-4 sm:p-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar>
            {bot.avatarUrl ? <AvatarImage src={bot.avatarUrl} alt={`${bot.name} avatar`} /> : null}
            <AvatarFallback className="font-display font-semibold">{bot.avatar}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold sm:text-lg">{bot.name}</h1>
            <p className="truncate text-xs text-muted-foreground sm:text-sm">{bot.description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={handleClearChat}
            aria-label="Clear chat"
            title="Clear chat"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/" className="inline-flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Link>
          </Button>
        </div>
      </header>

      <section className="flex flex-1 flex-col rounded-2xl border bg-card/90 backdrop-blur-sm">
        <ScrollArea className="h-[calc(100vh-14rem)] p-3 sm:h-[calc(100vh-15rem)] sm:p-5">
          <div className="space-y-3">
            {messages.length === 0 && !isLoading && (
              <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                No messages yet. Ask your first question to {bot.name}.
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`animate-fade-up flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`group relative max-w-[88%] rounded-2xl px-4 py-3 pr-12 text-sm leading-relaxed sm:max-w-[75%] ${
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-secondary-foreground"
                  }`}
                >
                  <CopyButton
                    text={normalizeMessageContent(message.content)}
                    label={message.role === "assistant" ? "Copy AI response" : "Copy your prompt"}
                    className={`absolute right-2 top-2 h-7 w-7 ${
                      message.role === "user"
                        ? "text-primary-foreground/90 hover:bg-white/20"
                        : "text-secondary-foreground/90 hover:bg-black/10"
                    } sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100`}
                  />
                  <MessageContent content={message.content} />
                </div>
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-secondary px-4 py-3 text-sm text-secondary-foreground">
                  {bot.name} is typing...
                </div>
              </div>
            )}

            <div ref={endOfMessagesRef} />
          </div>
        </ScrollArea>

        <form
          ref={formRef}
          onSubmit={handleSend}
          className="border-t p-3 sm:p-4"
        >
          <div className="flex items-center gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  formRef.current?.requestSubmit();
                }
              }}
              placeholder="Type your message..."
              disabled={isLoading}
              className="min-h-10 max-h-40 resize-none"
            />
            {isLoading ? (
              <Button
                type="button"
                size="icon"
                variant="outline"
                onClick={handleStop}
                aria-label="Stop generating"
              >
                <Square className="h-4 w-4" />
              </Button>
            ) : (
              <Button type="submit" size="icon" disabled={!input.trim()}>
                <SendHorizonal className="h-4 w-4" />
                <span className="sr-only">Send</span>
              </Button>
            )}
          </div>
          {error && (
            <div className="mt-2 flex items-center gap-2">
              <p className="text-xs text-destructive">{error}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1 px-2 text-xs"
                onClick={handleRetry}
              >
                <RefreshCcw className="h-3 w-3" />
                Retry
              </Button>
            </div>
          )}
        </form>
      </section>
    </main>
  );
}
