"use client";

import { useMemo } from "react";
import { useLocalStorageState } from "@/hooks/use-local-storage";
import type { ChatMessage, Chatbot } from "@/types/chat";

const CHATBOTS_KEY = "multi-chatbot-dashboard.chatbots";
const HISTORIES_KEY = "multi-chatbot-dashboard.histories";

type HistoryMap = Record<string, ChatMessage[]>;

interface CreateBotInput {
  name: string;
  description: string;
  systemContext: string;
  avatarUrl?: string;
}

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function createAvatarFromName(name: string) {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const words = trimmed.split(/\s+/);
  return words
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
}

export function useChatbots() {
  const [chatbots, setChatbots] = useLocalStorageState<Chatbot[]>(CHATBOTS_KEY, []);
  const [histories, setHistories] = useLocalStorageState<HistoryMap>(HISTORIES_KEY, {});

  const sortedChatbots = useMemo(() => {
    return [...chatbots].sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }, [chatbots]);

  const createBot = (input: CreateBotInput) => {
    const newBot: Chatbot = {
      id: createId(),
      name: input.name.trim(),
      description: input.description.trim(),
      systemContext: input.systemContext.trim(),
      avatarUrl: input.avatarUrl?.trim() || undefined,
      avatar: createAvatarFromName(input.name),
      createdAt: new Date().toISOString(),
    };

    setChatbots((prev) => [newBot, ...prev]);
    setHistories((prev) => ({
      ...prev,
      [newBot.id]: prev[newBot.id] ?? [],
    }));

    return newBot;
  };

  const updateBot = (botId: string, input: CreateBotInput) => {
    const nextName = input.name.trim();

    setChatbots((prev) =>
      prev.map((bot) => {
        if (bot.id !== botId) return bot;

        return {
          ...bot,
          name: nextName,
          description: input.description.trim(),
          systemContext: input.systemContext.trim(),
          avatarUrl: input.avatarUrl?.trim() || undefined,
          avatar: createAvatarFromName(nextName),
        };
      })
    );
  };

  const deleteBot = (botId: string) => {
    setChatbots((prev) => prev.filter((bot) => bot.id !== botId));
    setHistories((prev) => {
      const next = { ...prev };
      delete next[botId];
      return next;
    });
  };

  const getBotById = (botId: string) => chatbots.find((bot) => bot.id === botId);

  const getHistoryByBotId = (botId: string) => histories[botId] ?? [];

  const appendMessage = (botId: string, message: ChatMessage) => {
    setHistories((prev) => ({
      ...prev,
      [botId]: [...(prev[botId] ?? []), message],
    }));
  };

  const updateMessageContent = (
    botId: string,
    messageId: string,
    content: string
  ) => {
    setHistories((prev) => ({
      ...prev,
      [botId]: (prev[botId] ?? []).map((message) =>
        message.id === messageId ? { ...message, content } : message
      ),
    }));
  };

  const replaceHistory = (botId: string, messages: ChatMessage[]) => {
    setHistories((prev) => ({
      ...prev,
      [botId]: messages,
    }));
  };

  return {
    chatbots: sortedChatbots,
    createBot,
    updateBot,
    deleteBot,
    getBotById,
    getHistoryByBotId,
    appendMessage,
    updateMessageContent,
    replaceHistory,
  };
}
