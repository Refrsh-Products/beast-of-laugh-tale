import {
  listChatSessions,
  getChatSession,
  createChatSession,
  updateChatSession,
  deleteChatSession,
  listChatMessages,
  createChatMessage,
} from "../../storage";
import type { ChatServices } from "@freshr/shared";

const ChatServiceMock: ChatServices = {
  listChatSessions: (notebookId) => Promise.resolve(listChatSessions(notebookId)),

  createChatSession: (notebookId, title) =>
    Promise.resolve(createChatSession(notebookId, title)),

  updateChatSession: (chatId, title) =>
    Promise.resolve(updateChatSession(chatId, title)),

  deleteChatSession: (chatId) => {
    deleteChatSession(chatId);
    return Promise.resolve();
  },

  getChatSessionDetails: (chatId) =>
    Promise.resolve(getChatSession(chatId)),

  getChatSessionMessages: (chatId) =>
    Promise.resolve(listChatMessages(chatId)),

  createChatSessionMessage: (chatId, content) =>
    Promise.resolve(createChatMessage(chatId, "user", content)),

  streamChatReply: () => {
    return Promise.reject(new Error("Not implemented"));
  },
};

export default ChatServiceMock;
