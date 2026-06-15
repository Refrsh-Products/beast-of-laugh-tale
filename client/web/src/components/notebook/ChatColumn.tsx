import { useState, useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import type { Message } from "./ChatMessage";
import type {
  ChatSession,
  ChatMessage as ApiChatMessage,
} from "@freshr/shared";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

interface ChatColumnProps {
  onSend: (
    message: string,
    onChunk?: (text: string) => void,
  ) => Promise<{ reply: string; sessionId: string }>;
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
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
        setEditingId(null);
      }
    }
    if (dropdownOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
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
    if (!activeSessionId) {
      setMessages([]);
      return;
    }
    if (skipFetchRef.current === activeSessionId) {
      skipFetchRef.current = null;
      return;
    }
    setMessages([]);
    setIsLoading(true);
    getChatMessages(activeSessionId)
      .then((apiMessages) => {
        const sorted = [...apiMessages].sort(
          (a, b) => a.order_index - b.order_index,
        );
        setMessages(
          sorted.map((m, i) => ({
            id: i,
            role: m.role === "user" ? "user" : "ai",
            text: m.content,
          })),
        );
        nextId.current = sorted.length;
      })
      .finally(() => setIsLoading(false));
  }, [activeSessionId]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: nextId.current++,
      role: "user",
      text: trimmed,
    };
    const aiMessageId = nextId.current++;
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    setMessages((prev) => [...prev, { id: aiMessageId, role: "ai", text: "" }]);

    try {
      const { sessionId: returnedSessionId } = await onSend(
        trimmed,
        (chunk) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMessageId ? { ...m, text: m.text + chunk } : m,
            ),
          );
        },
      );

      if (returnedSessionId !== activeSessionId) {
        skipFetchRef.current = returnedSessionId;
        onSessionCreated(returnedSessionId);
      }
    } catch {
      setMessages((prev) =>
        prev.filter((m) => m.id !== userMessage.id && m.id !== aiMessageId),
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#f5f5f0",
        borderRight: `2px solid ${B}`,
        overflow: "hidden",
      }}
    >
      {/* Header: session name + ⋮ menu */}
      <div
        style={{
          height: 44,
          padding: "0 16px",
          borderBottom: `2px solid ${B}`,
          background: W,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
          gap: 10,
        }}
      >
        {/* Left: session name or naming input */}
        {isNaming ? (
          <div style={{ display: "flex", gap: 6, flex: 1 }}>
            <input
              autoFocus
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleConfirmNew();
                if (e.key === "Escape") {
                  setIsNaming(false);
                  setNewTitle("");
                }
              }}
              placeholder="Session title (optional)"
              style={{
                flex: 1,
                border: `1.5px solid ${B}`,
                padding: "4px 8px",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.75rem",
                outline: "none",
                background: W,
              }}
            />
            <button
              onClick={handleConfirmNew}
              style={{
                border: `1.5px solid ${B}`,
                background: B,
                color: W,
                padding: "4px 10px",
                cursor: "pointer",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.75rem",
              }}
            >
              ✓
            </button>
            <button
              onClick={() => {
                setIsNaming(false);
                setNewTitle("");
              }}
              style={{
                border: `1.5px solid #ccc`,
                background: "transparent",
                color: "#000000",
                padding: "4px 8px",
                cursor: "pointer",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.75rem",
              }}
            >
              ✕
            </button>
          </div>
        ) : (
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.78rem",
              fontWeight: 700,
              color: B,
              letterSpacing: "0.02em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              flex: 1,
            }}
          >
            {currentSession?.title || "No session selected"}
          </span>
        )}
        {/* Right: ⋮ button + floating dropdown */}
        {!isNaming && (
          <div
            ref={dropdownRef}
            style={{ position: "relative", flexShrink: 0 }}
          >
            <button
              onClick={() => setDropdownOpen((o) => !o)}
              style={{
                background: dropdownOpen ? B : "transparent",
                border: `1.5px solid ${dropdownOpen ? B : "#ddd"}`,
                color: dropdownOpen ? W : B,
                width: 28,
                height: 28,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "1rem",
                lineHeight: 1,
                transition: "background 0.1s, border-color 0.1s",
                flexShrink: 0,
              }}
            >
              ⋮
            </button>

            {dropdownOpen && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "calc(100% + 6px)",
                  background: W,
                  border: `2px solid ${B}`,
                  boxShadow: `4px 4px 0 ${B}`,
                  minWidth: 210,
                  maxWidth: "calc(100vw - 32px)",
                  zIndex: 100,
                  overflow: "hidden",
                }}
              >
                {/* New chat */}
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    setIsNaming(true);
                    setNewTitle("");
                  }}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    background: "transparent",
                    border: "none",
                    borderBottom: `1.5px solid #eee`,
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: B,
                    cursor: "pointer",
                    textAlign: "left",
                    letterSpacing: "0.02em",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = "#f5f5f0")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  + New chat
                </button>

                {/* Session list */}
                <div style={{ maxHeight: 220, overflowY: "auto" }}>
                  {sessions.length === 0 ? (
                    <div
                      style={{
                        padding: "10px 14px",
                        fontFamily: "'IBM Plex Mono', monospace",
                        fontSize: "0.75rem",
                        color: "#000000",
                      }}
                    >
                      No sessions yet
                    </div>
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
                          style={{
                            display: "flex",
                            alignItems: "center",
                            background: isActive
                              ? B
                              : isHovered
                                ? "#f5f5f0"
                                : W,
                            borderLeft: isActive
                              ? `3px solid ${G}`
                              : "3px solid transparent",
                            borderBottom: "1px solid #f0f0f0",
                          }}
                        >
                          {isEditing ? (
                            <input
                              autoFocus
                              value={editTitle}
                              onChange={(e) => setEditTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter")
                                  handleConfirmRename(s.id);
                                if (e.key === "Escape") setEditingId(null);
                              }}
                              onBlur={() => handleConfirmRename(s.id)}
                              style={{
                                flex: 1,
                                border: "none",
                                borderBottom: `1.5px solid ${B}`,
                                padding: "8px 14px",
                                fontFamily: "'IBM Plex Mono', monospace",
                                fontSize: "0.75rem",
                                background: "transparent",
                                color: isActive ? W : B,
                                outline: "none",
                              }}
                            />
                          ) : (
                            <>
                              <div
                                onClick={() => {
                                  onSessionSelect(s.id);
                                  setDropdownOpen(false);
                                }}
                                style={{
                                  flex: 1,
                                  padding: "9px 14px",
                                  fontFamily: "'IBM Plex Mono', monospace",
                                  fontSize: "0.75rem",
                                  cursor: "pointer",
                                  color: isActive ? W : B,
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {s.title || "Untitled session"}
                              </div>
                              {(isHovered || isActive) && (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingId(s.id);
                                      setEditTitle(s.title || "");
                                    }}
                                    title="Rename"
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      cursor: "pointer",
                                      color: isActive ? W : B,
                                      padding: "0 6px",
                                      fontSize: "0.75rem",
                                      flexShrink: 0,
                                    }}
                                  >
                                    ✎
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteSession(s.id);
                                    }}
                                    title="Delete"
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      cursor: "pointer",
                                      color: isActive ? "#ff8080" : "#ccc",
                                      padding: "0 10px 0 0",
                                      fontSize: "0.75rem",
                                      flexShrink: 0,
                                    }}
                                  >
                                    ✕
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
        <div
          style={{
            padding: "8px 16px",
            background: "#fffbe6",
            borderBottom: `1.5px solid #f0c040`,
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexShrink: 0,
          }}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            style={{ flexShrink: 0 }}
          >
            <circle
              cx="6"
              cy="6"
              r="4"
              fill="none"
              stroke="#ccc"
              strokeWidth="1.8"
            />
            <path
              d="M6 2 A4 4 0 0 1 10 6"
              fill="none"
              stroke="#888"
              strokeWidth="1.8"
              strokeLinecap="round"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 6 6"
                to="360 6 6"
                dur="0.8s"
                repeatCount="indefinite"
              />
            </path>
          </svg>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.75rem",
              color: "#7a6000",
            }}
          >
            Indexing your files — chat will unlock once ready.
          </span>
        </div>
      )}

      {/* Messages area */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {messages.length === 0 && !isLoading ? (
          <EmptyState />
        ) : (
          <>
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input bar */}
      <div
        style={{
          borderTop: `2px solid ${B}`,
          padding: "12px 16px",
          background: W,
          display: "flex",
          gap: 10,
          flexShrink: 0,
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={chatDisabled}
          placeholder={
            chatDisabled
              ? "Waiting for files to finish indexing..."
              : "Ask a question about your notes..."
          }
          style={{
            flex: 1,
            border: `2px solid ${chatDisabled ? "#ccc" : B}`,
            borderRadius: 0,
            padding: "10px 12px",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.78rem",
            background: chatDisabled ? "#f5f5f5" : W,
            outline: "none",
            boxSizing: "border-box",
            color: B,
            cursor: chatDisabled ? "not-allowed" : "text",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading || chatDisabled}
          onMouseEnter={(e) => {
            if (input.trim() && !isLoading) {
              e.currentTarget.style.transform = "translate(-1.5px, -1.5px)";
              e.currentTarget.style.boxShadow = `4px 4px 0 ${G}`;
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow =
              input.trim() && !isLoading ? `3px 3px 0 ${G}` : "none";
          }}
          style={{
            background:
              input.trim() && !isLoading && !chatDisabled ? B : "#ccc",
            color: W,
            border: `2px solid ${input.trim() && !isLoading && !chatDisabled ? B : "#ccc"}`,
            boxShadow:
              input.trim() && !isLoading && !chatDisabled
                ? `3px 3px 0 ${G}`
                : "none",
            padding: "10px 16px",
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 700,
            fontSize: "0.78rem",
            cursor:
              input.trim() && !isLoading && !chatDisabled
                ? "pointer"
                : "not-allowed",
            flexShrink: 0,
            lineHeight: 1,
            transition: "transform 0.15s, box-shadow 0.15s",
          }}
        >
          →
        </button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        padding: "40px 20px",
        textAlign: "center",
      }}
    >
      <p
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: "1rem",
          color: "#222",
          margin: 0,
        }}
      >
        Your notes are loaded.
        <br />
        Your brain is not.
      </p>
      <p
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.75rem",
          color: "#000000",
          margin: 0,
          lineHeight: 1.6,
        }}
      >
        Ask something. Anything.
        <br />
        Even a bad question beats no question.
      </p>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", justifyContent: "flex-start" }}>
      <div
        style={{
          background: "#fff",
          border: "2px solid #000",
          boxShadow: "3px 3px 0 #000",
          padding: "10px 16px",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.78rem",
          color: "#000000",
          letterSpacing: "0.1em",
        }}
      >
        thinking...
      </div>
    </div>
  );
}
