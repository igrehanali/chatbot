"use client";

import {
  createContext,
  useContext,
  type PropsWithChildren,
} from "react";
import { useChatbots } from "@/hooks/use-chatbots";

const ChatbotsContext = createContext<ReturnType<typeof useChatbots> | null>(null);

export function ChatbotsProvider({ children }: PropsWithChildren) {
  const value = useChatbots();
  return (
    <ChatbotsContext.Provider value={value}>{children}</ChatbotsContext.Provider>
  );
}

export function useChatbotsContext() {
  const context = useContext(ChatbotsContext);
  if (!context) {
    throw new Error("useChatbotsContext must be used within ChatbotsProvider");
  }
  return context;
}
