import { useMemo } from "react";
import type {
  ChatServices,
  ChatMessage,
  ChatSession,
} from "../services/chat/ChatService.types";
import createFreshrApiInstance, {
  ChatServiceApiEndpoints,
} from "../services/freshr-api";
import useAxiosInterceptor from "./useAxiosInterceptor";
import { useFetch } from "./useFetch";

const useChatServiceApi = (): ChatServices => {
  const api = useMemo(() => createFreshrApiInstance(), []);
  const apiWithInterceptor = useAxiosInterceptor(api, true);
  const { fetchData } = useFetch(apiWithInterceptor);

  return {
    listChatSessions: async (notebookId) => {
      try {
        const response = await fetchData<ChatSession[]>(
          ChatServiceApiEndpoints.getChatSessions,
          "GET",
          null,
          { params: { notebook: notebookId } },
        );
        return response;
      } catch (err) {
        throw err;
      }
    },

    createChatSession: async (notebookId, title) => {
      try {
        const response = await fetchData<ChatSession>(
          ChatServiceApiEndpoints.createChatSession,
          "POST",
          { notebook: notebookId, ...(title ? { title } : {}) },
        );
        return response;
      } catch (err) {
        throw err;
      }
    },

    updateChatSession: async (chatId, title) => {
      try {
        const response = await fetchData<ChatSession>(
          ChatServiceApiEndpoints.updateChatSession(chatId),
          "PATCH",
          { title: title },
        );
        return response;
      } catch (err) {
        throw err;
      }
    },

    deleteChatSession: async (chatId) => {
      try {
        await fetchData(
          ChatServiceApiEndpoints.deleteChatSession(chatId),
          "DELETE",
        );
      } catch (err) {
        throw err;
      }
    },

    getChatSessionDetails: async (chatId) => {
      try {
        const response = await fetchData<ChatSession>(
          ChatServiceApiEndpoints.getChatSessionDetails(chatId),
          "GET",
        );
        return response;
      } catch (err) {
        throw err;
      }
    },

    getChatSessionMessages: async (chatId) => {
      try {
        const response = await fetchData<ChatMessage[]>(
          ChatServiceApiEndpoints.getChatSessionMessages(chatId),
          "GET",
        );
        return response;
      } catch (err) {
        throw err;
      }
    },

    createChatSessionMessage: async (chatId, content) => {
      try {
        const response = await fetchData<ChatMessage>(
          ChatServiceApiEndpoints.createChatSessionMessage(chatId),
          "POST",
          { content },
        );
        return response;
      } catch (err) {
        throw err;
      }
    },

    streamChatReply: async (
      chatId: string,
      onChunk: (text: string) => void,
    ): Promise<void> => {
      const token = sessionStorage.getItem("accessToken");
      const url = `${import.meta.env.VITE_API_BASE_URL}${ChatServiceApiEndpoints.chatMessageStream(chatId)}`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });

        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));
        for (const line of lines) {
          const raw = line.slice(6); // strip "data: "
          if (raw === "[DONE]") continue;
          const parsed = JSON.parse(raw);
          if (parsed.text) onChunk(parsed.text);
        }
      }
    },
  };
};

export default useChatServiceApi;
