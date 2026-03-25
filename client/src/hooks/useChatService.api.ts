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
  };
};

export default useChatServiceApi;
