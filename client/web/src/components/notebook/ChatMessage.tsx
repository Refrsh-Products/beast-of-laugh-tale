import MathMarkdown from "../common/MathMarkdown";
import { cn } from "../../lib/utils";

export interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
}

export default function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-3 py-2 text-sm leading-relaxed",
          isUser
            ? "bg-secondary text-foreground"
            : "text-foreground",
        )}
      >
        {isUser ? (
          message.text
        ) : (
          <MathMarkdown
            components={{
              p: ({ children }: { children?: React.ReactNode }) => (
                <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>
              ),
              strong: ({ children }: { children?: React.ReactNode }) => (
                <strong className="font-semibold">{children}</strong>
              ),
              ul: ({ children }: { children?: React.ReactNode }) => (
                <ul className="my-1 pl-5 list-disc">{children}</ul>
              ),
              ol: ({ children }: { children?: React.ReactNode }) => (
                <ol className="my-1 pl-5 list-decimal">{children}</ol>
              ),
              li: ({ children }: { children?: React.ReactNode }) => (
                <li className="mb-0.5">{children}</li>
              ),
              h1: ({ children }: { children?: React.ReactNode }) => (
                <h1 className="text-sm font-semibold mt-3 mb-1">{children}</h1>
              ),
              h2: ({ children }: { children?: React.ReactNode }) => (
                <h2 className="text-sm font-semibold mt-3 mb-1">{children}</h2>
              ),
              h3: ({ children }: { children?: React.ReactNode }) => (
                <h3 className="text-xs font-semibold mt-2 mb-1">{children}</h3>
              ),
              code: ({ children, className }: { children?: React.ReactNode; className?: string }) => {
                const isBlock = className?.startsWith("language-");
                return isBlock ? (
                  <pre className="bg-secondary rounded-md border border-border px-3 py-2 overflow-x-auto my-2 text-xs">
                    <code>{children}</code>
                  </pre>
                ) : (
                  <code className="bg-secondary border border-border rounded px-1 py-px text-xs">
                    {children}
                  </code>
                );
              },
            }}
          >
            {message.text}
          </MathMarkdown>
        )}
      </div>
    </div>
  );
}
