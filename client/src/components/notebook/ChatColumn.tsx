import { useState, useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import type { Message } from "./ChatMessage";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

interface ChatColumnProps {
  onSend: (message: string) => Promise<string>;
}

export default function ChatColumn({ onSend }: ChatColumnProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  let nextId = useRef(0);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend() {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: Message = {
      id: nextId.current++,
      role: "user",
      text: trimmed,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // TODO: wire up real RAG query via notebookService when Safwan is ready
      const reply = await onSend(trimmed);
      const aiMessage: Message = {
        id: nextId.current++,
        role: "ai",
        text: reply,
      };
      setMessages((prev) => [...prev, aiMessage]);
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
      {/* Column header */}
      <div
        style={{
          padding: "14px 16px 10px",
          borderBottom: `2px solid ${B}`,
          background: W,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "#555",
          }}
        >
          CHAT
        </span>
      </div>

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
        {messages.length === 0 ? (
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
          placeholder="Ask a question about your notes..."
          style={{
            flex: 1,
            border: `2px solid ${B}`,
            borderRadius: 0,
            padding: "10px 12px",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.78rem",
            background: W,
            outline: "none",
            boxSizing: "border-box",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isLoading}
          style={{
            background: input.trim() && !isLoading ? B : "#ccc",
            color: W,
            border: `2px solid ${input.trim() && !isLoading ? B : "#ccc"}`,
            boxShadow: input.trim() && !isLoading ? `3px 3px 0 ${G}` : "none",
            padding: "10px 16px",
            fontFamily: "'IBM Plex Mono', monospace",
            fontWeight: 700,
            fontSize: "0.78rem",
            cursor: input.trim() && !isLoading ? "pointer" : "not-allowed",
            flexShrink: 0,
            lineHeight: 1,
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
      <span style={{ fontSize: "2rem" }}>🧠</span>
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
          fontSize: "0.7rem",
          color: "#aaa",
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
          color: "#aaa",
          letterSpacing: "0.1em",
        }}
      >
        thinking...
      </div>
    </div>
  );
}
