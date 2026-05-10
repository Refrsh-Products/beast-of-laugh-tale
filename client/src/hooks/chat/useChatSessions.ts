import type { UseChatSessions } from "./useChatSessions.types";
import type { ChatSession } from "../../services/chat/ChatService.types";
import useChatService from "../../services/chat";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { NotebookFile } from "../../storage";
import type { ToastVariant } from "../useToast";

const useChatSessions = (
  notebookId: string,
  showToast: (msg: string, variant: ToastVariant) => void,
  files: NotebookFile[],
  hasReadyFiles: boolean,
): UseChatSessions & {
  chatSessions: ChatSession[];
  activeSessionId: string | null;
} => {
  const chatService = useChatService();

  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const activeSessionId = searchParams.get("session");

  useEffect(() => {
    chatService
      .listChatSessions(notebookId)
      .then(setChatSessions)
      .catch(() => {
        showToast("Failed to load chat sessions", "danger");
      });
  }, [notebookId]);

  return {
    chatSessions,
    activeSessionId,
    handleSendMessage: async (message, onChunk) => {
      if (files.length === 0) {
        showToast("Upload lecture notes before chatting", "danger");
        throw new Error("no files");
      }
      if (!hasReadyFiles) {
        showToast(
          "Your files are still being indexed. Please wait...",
          "danger",
        );
        throw new Error("files processing");
      }

      let sessionId = activeSessionId;
      const sessionExists = chatSessions.some((s) => s.id === sessionId);

      if (!sessionId || !sessionExists) {
        const session = await chatService.createChatSession(notebookId);
        sessionId = session.id;
        setChatSessions((prev) => [...prev, session]);
        // URL update is intentionally left to ChatColumn via onSessionCreated
      }

      await chatService.createChatSessionMessage(sessionId, message);

      // Stream AI response
      let fullReply = "";
      await chatService.streamChatReply(sessionId, (chunk) => {
        fullReply += chunk;
        onChunk?.(chunk);
      });

      return {
        reply: fullReply,
        sessionId,
      };
    },
    handleSessionSelect: (sessionId) => {
      setSearchParams({ session: sessionId });
    },
    handleSessionCreated: (sessionId) => {
      setSearchParams({ session: sessionId }, { replace: true });
    },
    handleNewSession: async (title = "Untitled Chat") => {
      const session = await chatService.createChatSession(notebookId, title);
      setChatSessions((prev) => [...prev, session]);
      return session.id;
      // URL update is intentionally left to ChatColumn via onSessionCreated
    },
    handleRenameSession: async (chatId, title) => {
      await chatService.updateChatSession(chatId, title);
      setChatSessions((prev) =>
        prev.map((s) => (s.id === chatId ? { ...s, title } : s)),
      );
    },
    handleDeleteSession: async (chatId) => {
      await chatService.deleteChatSession(chatId);
      setChatSessions((prev) => prev.filter((s) => s.id !== chatId));
      if (activeSessionId === chatId) {
        setSearchParams({});
      }
    },
  };
};

export default useChatSessions;
