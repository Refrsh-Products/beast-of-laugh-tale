const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

export interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
}

export default function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          background: isUser ? B : W,
          color: isUser ? W : B,
          border: `2px solid ${B}`,
          boxShadow: isUser ? `3px 3px 0 ${G}` : `3px 3px 0 ${B}`,
          padding: "10px 14px",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.78rem",
          lineHeight: 1.6,
        }}
      >
        {message.text}
      </div>
    </div>
  );
}
