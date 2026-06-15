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
