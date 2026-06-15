export interface UseChatSessions {
  handleSendMessage(
    message: string,
    onChunk?: (text: string) => void,
  ): Promise<{ reply: string; sessionId: string }>;
  handleSessionSelect(sessionId: string): void;
  handleSessionCreated(sessionId: string): void;
  handleNewSession(title?: string): Promise<string>;
  handleRenameSession(chatId: string, title: string): Promise<void>;
  handleDeleteSession(chatId: string): Promise<void>;
}
