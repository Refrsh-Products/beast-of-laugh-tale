import type { ServiceDeps } from "../platform/deps";
import { ChatServiceApiEndpoints } from "./endpoints";

export interface ChatMessage {
  id: string;
  role: "user" | "chatbot";
  content: string;
  token_count: number | null;
  order_index: number;
  sent_at: string;
  is_deleted: boolean;
}

export interface ChatSession {
  id: string;
  notebook_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface ChatServices {
  listChatSessions(notebookId: string): Promise<ChatSession[]>;
  createChatSession(notebookId: string, title?: string): Promise<ChatSession>;
  updateChatSession(chatId: string, title: string): Promise<ChatSession>;
  deleteChatSession(chatId: string): Promise<void>;
  getChatSessionDetails(chatId: string): Promise<ChatSession>;
  getChatSessionMessages(chatId: string): Promise<ChatMessage[]>;
  createChatSessionMessage(
    chatId: string,
    content: string,
  ): Promise<ChatMessage>;
  streamChatReply(
    chatId: string,
    onChunk: (text: string) => void,
  ): Promise<void>;
}

export function createChatService(deps: ServiceDeps): ChatServices {
  const { http, session, config, stream } = deps;

  return {
    listChatSessions: async (notebookId) => {
      return await http.request<ChatSession[]>(
        ChatServiceApiEndpoints.getChatSessions,
        "GET",
        null,
        { params: { notebook: notebookId } },
      );
    },

    createChatSession: async (notebookId, title) => {
      return await http.request<ChatSession>(
        ChatServiceApiEndpoints.createChatSession,
        "POST",
        { notebook: notebookId, ...(title ? { title } : {}) },
      );
    },

    updateChatSession: async (chatId, title) => {
      return await http.request<ChatSession>(
        ChatServiceApiEndpoints.updateChatSession(chatId),
        "PATCH",
        { title: title },
      );
    },

    deleteChatSession: async (chatId) => {
      await http.request(ChatServiceApiEndpoints.deleteChatSession(chatId), "DELETE");
    },

    getChatSessionDetails: async (chatId) => {
      return await http.request<ChatSession>(
        ChatServiceApiEndpoints.getChatSessionDetails(chatId),
        "GET",
      );
    },

    getChatSessionMessages: async (chatId) => {
      return await http.request<ChatMessage[]>(
        ChatServiceApiEndpoints.getChatSessionMessages(chatId),
        "GET",
      );
    },

    createChatSessionMessage: async (chatId, content) => {
      return await http.request<ChatMessage>(
        ChatServiceApiEndpoints.createChatSessionMessage(chatId),
        "POST",
        { content },
      );
    },

    streamChatReply: async (chatId, onChunk) => {
      const url = `${config.apiBaseUrl}${ChatServiceApiEndpoints.chatMessageStream(chatId)}`;
      await stream.streamSse(url, session.getAccessToken(), onChunk);
    },
  };
}
