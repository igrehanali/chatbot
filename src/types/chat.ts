export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
}

export interface Chatbot {
  id: string;
  name: string;
  avatar: string;
  avatarUrl?: string;
  description: string;
  systemContext: string;
  createdAt: string;
}

export interface ChatRequestMessage {
  role: "system" | MessageRole;
  content: string;
}
