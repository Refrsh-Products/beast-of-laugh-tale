import { useState, useRef, useEffect } from "react";
import ChatMessage from "./ChatMessage";
import type { Message } from "./ChatMessage";
import type { ChatMessage as ApiChatMessage } from "@freshr/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RiSendPlane2Line, RiLoader4Line } from "@remixicon/react";

interface ChatColumnProps {
  onSend: (
    message: string,
    onChunk?: (text: string) => void,
  ) => Promise<{ reply: string; sessionId: string }>;
  activeSessionId: string | null;
  onSessionCreated: (sessionId: string) => void;
  getChatMessages: (chatId: string) => Promise<ApiChatMessage[]>;
  chatDisabled?: boolean;
  initialInput?: string;
  onInitialInputConsumed?: () => void;
}

export default function ChatColumn({
  onSend,
  activeSessionId,
  onSessionCreated,
  getChatMessages,
  chatDisabled = false,
  initialInput,
  onInitialInputConsumed,
}: ChatColumnProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const nextId = useRef(0);
  const skipFetchRef = useRef<string | null>(null);

  // Pre-populate input when arriving from "Take to Chat" in the quiz screen
  useEffect(() => {
    if (initialInput) {
      setInput(initialInput);
      onInitialInputConsumed?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInput]);

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

  const canSend = !!input.trim() && !isLoading && !chatDisabled;

  return (
    <div className="bg-background flex h-full flex-col overflow-hidden">
      {/* The session name and switcher used to live here. Sessions now have
          a permanent home in the notebook sidebar, so keeping a second
          control for them here would be two sources of truth. */}

      {chatDisabled && (
        <div className="bg-muted text-muted-foreground border-border flex shrink-0 items-center gap-2 border-b px-4 py-2 text-sm">
          <RiLoader4Line className="size-4 animate-spin" aria-hidden="true" />
          Indexing your files — chat will unlock once ready.
        </div>
      )}

      <div
        className="freshr-scroll flex flex-1 flex-col gap-3 overflow-y-auto px-4 py-5"
        role="log"
        aria-live="polite"
        aria-label="Conversation"
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

      <div className="bg-card border-border flex shrink-0 items-center gap-2 border-t px-4 py-3">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          disabled={chatDisabled}
          aria-label="Message"
          placeholder={
            chatDisabled
              ? "Waiting for files to finish indexing..."
              : "Ask a question about your notes..."
          }
        />
        <Button
          onClick={handleSend}
          disabled={!canSend}
          size="icon"
          aria-label="Send message"
          className="shrink-0"
        >
          <RiSendPlane2Line aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 px-5 py-10 text-center">
      <p className="text-xl font-bold tracking-[-0.02em]">
        Your notes are loaded.
        <br />
        Your brain is not.
      </p>
      <p className="text-muted-foreground leading-relaxed">
        Ask something. Anything.
        <br />
        Even a bad question beats no question.
      </p>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-card border-border text-muted-foreground flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm">
        <RiLoader4Line className="size-4 animate-spin" aria-hidden="true" />
        Thinking…
      </div>
    </div>
  );
}
