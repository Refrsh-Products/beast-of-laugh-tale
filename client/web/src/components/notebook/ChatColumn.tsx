import { useState, useRef, useEffect } from "react";
import { MoreVertical, Plus, Send, Pencil, X } from "lucide-react";
import ChatMessage from "./ChatMessage";
import type { Message } from "./ChatMessage";
import type { ChatSession, ChatMessage as ApiChatMessage } from "@freshr/shared";
import { cn } from "../../lib/utils";

interface ChatColumnProps {
  onSend: (message: string, onChunk?: (text: string) => void) => Promise<{ reply: string; sessionId: string }>;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSessionSelect: (sessionId: string) => void;
  onNewSession: (title?: string) => Promise<string>;
  onSessionCreated: (sessionId: string) => void;
  onRenameSession: (chatId: string, title: string) => Promise<void>;
  onDeleteSession: (chatId: string) => Promise<void>;
  getChatMessages: (chatId: string) => Promise<ApiChatMessage[]>;
  chatDisabled?: boolean;
  initialInput?: string;
  onInitialInputConsumed?: () => void;
}

export default function ChatColumn({
  onSend,
  sessions,
  activeSessionId,
  onSessionSelect,
  onNewSession,
  onSessionCreated,
  onRenameSession,
  onDeleteSession,
  getChatMessages,
  chatDisabled = false,
  initialInput,
  onInitialInputConsumed,
}: ChatColumnProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isNaming, setIsNaming] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const skipFetchRef = useRef<string | null>(null);

  const currentSession = sessions.find((s) => s.id === activeSessionId);

  // Pre-populate input when arriving from "Take to Chat" in the quiz screen
  useEffect(() => {
    if (initialInput) {
      setInput(initialInput);
      onInitialInputConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInput]);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
        setEditingId(null);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [dropdownOpen]);

  async function handleConfirmNew() {
    const title = newTitle.trim();
    setIsNaming(false);
    setNewTitle("");
    const newId = await onNewSession(title || undefined);
    onSessionCreated(newId);
  }

  async function handleConfirmRename(id: string) {
    const title = editTitle.trim();
    setEditingId(null);
    if (title) await onRenameSession(id, title);
  }

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (!activeSessionId) { setMessages([]); return; }
    if (skipFetchRef.current === activeSessionId) { skipFetchRef.current = null; return; }
    setMessages([]);
    setIsLoading(true);
    getChatMessages(activeSessionId)
      .then((apiMessages) => {
        const sorted = [...apiMessages].sort((a, b) => a.order_index - b.order_index);
        setMessages(sorted.map((m, i) => ({ id: i, role: m.role === "user" ? "user" : "ai", text: m.content })));
        nextId.current = sorted.length;
      })
      .finally(() => setIsLoading(false));
  }, [activeSessionId]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = { id: nextId.current++, role: "user", text: trimmed };
    const aiMessageId = nextId.current++;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    setMessages((prev) => [...prev, { id: aiMessageId, role: "ai", text: "" }]);

    try {
      const { sessionId: returnedSessionId } = await onSend(trimmed, (chunk) => {
        setMessages((prev) => prev.map((m) => m.id === aiMessageId ? { ...m, text: m.text + chunk } : m));
      });
      if (returnedSessionId !== activeSessionId) {
        skipFetchRef.current = returnedSessionId;
        onSessionCreated(returnedSessionId);
      }
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id && m.id !== aiMessageId));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="flex flex-col h-full bg-background border-r border-border overflow-hidden">
      {/* Header: session name + menu */}
      <div className="h-11 flex items-center justify-between px-4 border-b border-border bg-card shrink-0 gap-2">
        {isNaming ? (
          <div className="flex gap-1.5 flex-1">
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmNew();
                if (e.key === "Escape") { setIsNaming(false); setNewTitle(""); }
              }}
              placeholder="Session title (optional)"
              className="flex-1 bg-input border border-border rounded-sm px-2 py-1 text-xs text-foreground outline-none focus:ring-1 focus:ring-ring"
            />
            <button onClick={handleConfirmNew} aria-label="Confirm" className="px-2 py-1 text-xs bg-primary text-primary-foreground rounded-sm">✓</button>
            <button onClick={() => { setIsNaming(false); setNewTitle(""); }} aria-label="Cancel" className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground">✕</button>
          </div>
        ) : (
          <span className="text-xs font-medium text-foreground truncate flex-1">
            {currentSession?.title || "No session selected"}
          </span>
        )}

        {!isNaming && (
          <div ref={dropdownRef} className="relative shrink-0">
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              aria-label="Chat sessions"
              className={cn(
                "flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground",
                dropdownOpen && "bg-secondary text-foreground",
              )}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-[calc(100%+6px)] z-50 w-52 rounded-md border border-border bg-popover shadow-lg overflow-hidden">
                <button
                  onClick={() => { setDropdownOpen(false); setIsNaming(true); setNewTitle(""); }}
                  className="flex items-center gap-2 w-full px-3 py-2.5 text-xs text-foreground hover:bg-secondary transition-colors border-b border-border text-left"
                >
                  <Plus className="h-3 w-3" />
                  New chat
                </button>

                <div className="max-h-56 overflow-y-auto">
                  {sessions.length === 0 ? (
                    <div className="px-3 py-2.5 text-xs text-muted-foreground">No sessions yet</div>
                  ) : (
                    sessions.map((s) => {
                      const isActive = s.id === activeSessionId;
                      const isEditing = editingId === s.id;
                      const isHovered = hoveredId === s.id;
                      return (
                        <div
                          key={s.id}
                          onMouseEnter={() => setHoveredId(s.id)}
                          onMouseLeave={() => setHoveredId(null)}
                          className={cn(
                            "flex items-center border-l-2 border-b border-border/50 transition-colors",
                            isActive ? "border-l-primary bg-secondary" : "border-l-transparent hover:bg-secondary/50",
                          )}
                        >
                          {isEditing ? (
                            <input
                              autoFocus
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleConfirmRename(s.id);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                              onBlur={() => handleConfirmRename(s.id)}
                              className="flex-1 bg-transparent border-b border-primary px-3 py-2 text-xs text-foreground outline-none"
                            />
                          ) : (
                            <>
                              <div
                                onClick={() => { onSessionSelect(s.id); setDropdownOpen(false); }}
                                className="flex-1 px-3 py-2 text-xs cursor-pointer text-foreground truncate"
                              >
                                {s.title || "Untitled session"}
                              </div>
                              {(isHovered || isActive) && (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); setEditingId(s.id); setEditTitle(s.title || ""); }}
                                    aria-label="Rename session"
                                    className="text-muted-foreground hover:text-foreground p-1.5"
                                  >
                                    <Pencil className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); onDeleteSession(s.id); }}
                                    aria-label="Delete session"
                                    className="text-muted-foreground hover:text-destructive p-1.5 pr-2"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Processing banner */}
      {chatDisabled && (
        <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 shrink-0">
          <div className="w-3 h-3 rounded-full border border-border border-t-muted-foreground animate-spin shrink-0" />
          <span className="text-xs text-amber-600 dark:text-amber-400">
            Indexing your files — chat will unlock once ready.
          </span>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
        {messages.length === 0 && !isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2.5 py-10 text-center">
            <p className="text-sm font-medium text-foreground">
              Your notes are loaded.<br />Your brain is not.
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ask something. Anything.<br />Even a bad question beats no question.
            </p>
          </div>
        ) : (
          <>
            {messages.map((msg) => <ChatMessage key={msg.id} message={msg} />)}
            {isLoading && (
              <div className="flex justify-start">
                <div className="rounded-lg px-3 py-2 text-sm text-muted-foreground">
                  thinking...
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div className="border-t border-border p-3 bg-card flex gap-2 shrink-0">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          disabled={chatDisabled}
          placeholder={chatDisabled ? "Waiting for files to finish indexing..." : "Ask a question about your notes..."}
          className={cn(
            "flex-1 rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground outline-none transition-colors focus:ring-1 focus:ring-ring placeholder:text-muted-foreground",
            chatDisabled && "opacity-50 cursor-not-allowed",
          )}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading || chatDisabled}
          className="flex items-center justify-center h-9 w-9 rounded-md bg-primary text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
