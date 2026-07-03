"use client";

import { useRouter } from "next/navigation";
import { BotCard } from "@/components/chat/bot-card";
import { CreateBotDialog } from "@/components/chat/create-bot-dialog";
import { useChatbotsContext } from "@/components/providers/chatbots-provider";

export default function HomePage() {
  const router = useRouter();
  const { chatbots, createBot, updateBot, getHistoryByBotId } = useChatbotsContext();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-6 sm:px-6 sm:py-10">
      <section className="animate-fade-up rounded-3xl border border-white/45 bg-card/85 p-5 shadow-sm backdrop-blur-md sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
              Personal AI Workspace
            </p>
            <h1 className="text-3xl font-semibold leading-tight sm:text-4xl">
              Multi-Chatbot Dashboard
            </h1>
            <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
              Create persona-driven bots, keep their context isolated, and continue each conversation anytime from local storage.
            </p>
          </div>

          <CreateBotDialog
            onSubmitBot={(input) => {
              const created = createBot(input);
              router.push(`/chat/${created.id}`);
            }}
          />
        </div>
      </section>

      <section className="mt-8">
        {chatbots.length === 0 ? (
          <div className="animate-fade-up rounded-2xl border border-dashed border-border bg-card/80 p-10 text-center">
            <h2 className="text-xl font-semibold">No chatbots yet</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
              Start by creating your first bot and defining its role in the dialog above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {chatbots.map((bot) => (
              <BotCard
                key={bot.id}
                bot={bot}
                messageCount={getHistoryByBotId(bot.id).length}
                onEditBot={(botId, input) => {
                  updateBot(botId, input);
                }}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
