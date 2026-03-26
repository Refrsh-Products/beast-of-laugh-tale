import ReactMarkdown from "react-markdown";

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
        {isUser ? (
          message.text
        ) : (
          <ReactMarkdown
            components={{
              p: ({ children }) => (
                <p style={{ margin: "0 0 0.5em", lineHeight: 1.6 }}>{children}</p>
              ),
              strong: ({ children }) => (
                <strong style={{ fontWeight: 700 }}>{children}</strong>
              ),
              ul: ({ children }) => (
                <ul style={{ margin: "0.4em 0", paddingLeft: "1.4em" }}>{children}</ul>
              ),
              ol: ({ children }) => (
                <ol style={{ margin: "0.4em 0", paddingLeft: "1.4em" }}>{children}</ol>
              ),
              li: ({ children }) => (
                <li style={{ marginBottom: "0.2em" }}>{children}</li>
              ),
              h1: ({ children }) => (
                <h1 style={{ fontSize: "1em", fontWeight: 700, margin: "0.6em 0 0.3em" }}>{children}</h1>
              ),
              h2: ({ children }) => (
                <h2 style={{ fontSize: "0.9em", fontWeight: 700, margin: "0.6em 0 0.3em" }}>{children}</h2>
              ),
              h3: ({ children }) => (
                <h3 style={{ fontSize: "0.85em", fontWeight: 700, margin: "0.5em 0 0.2em" }}>{children}</h3>
              ),
              code: ({ children, className }) => {
                const isBlock = className?.startsWith("language-");
                return isBlock ? (
                  <pre
                    style={{
                      background: "#f0f0eb",
                      border: "1px solid #ccc",
                      padding: "8px 10px",
                      overflowX: "auto",
                      margin: "0.5em 0",
                      fontSize: "0.75rem",
                    }}
                  >
                    <code>{children}</code>
                  </pre>
                ) : (
                  <code
                    style={{
                      background: "#f0f0eb",
                      border: "1px solid #ddd",
                      padding: "1px 4px",
                      fontSize: "0.75rem",
                    }}
                  >
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.text}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}
