import type { ReactNode } from "react";
import MathMarkdown from "../common/MathMarkdown";
import { cn } from "@/lib/utils";

export interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
}

/**
 * Markdown element overrides for AI replies. Defined once at module scope
 * rather than inline so the object identity is stable across renders —
 * streaming re-renders this component on every chunk.
 */
const MARKDOWN_COMPONENTS = {
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-2 leading-relaxed last:mb-0">{children}</p>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }: { children?: ReactNode }) => (
    <em className="italic">{children}</em>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="my-2 list-disc pl-5">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="my-2 list-decimal pl-5">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="mb-1 leading-relaxed">{children}</li>
  ),
  h1: ({ children }: { children?: ReactNode }) => (
    <h1 className="mt-3 mb-1 text-base font-bold">{children}</h1>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h2 className="mt-3 mb-1 text-sm font-bold">{children}</h2>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h3 className="mt-2 mb-1 text-sm font-semibold">{children}</h3>
  ),
  a: ({ children, href }: { children?: ReactNode; href?: string }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline underline-offset-2"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="border-border my-3" />,
  // Tables can exceed the bubble, so they scroll inside it rather than
  // stretching the conversation column.
  table: ({ children }: { children?: ReactNode }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full text-left text-sm">{children}</table>
    </div>
  ),
  th: ({ children }: { children?: ReactNode }) => (
    <th className="border-border border-b px-2 py-1 font-semibold">
      {children}
    </th>
  ),
  td: ({ children }: { children?: ReactNode }) => (
    <td className="border-border border-b px-2 py-1">{children}</td>
  ),
  code: ({
    children,
    className,
  }: {
    children?: ReactNode;
    className?: string;
  }) => {
    const isBlock = className?.startsWith("language-");
    return isBlock ? (
      <pre className="bg-muted border-border my-2 overflow-x-auto rounded-md border p-3">
        <code className="font-mono text-xs">{children}</code>
      </pre>
    ) : (
      <code className="bg-muted border-border rounded border px-1 py-0.5 font-mono text-xs">
        {children}
      </code>
    );
  },
};

export default function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";

  return (
    <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] rounded-lg px-4 py-2.5 text-sm",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-card border-border border",
        )}
      >
        {isUser ? (
          <span className="leading-relaxed whitespace-pre-wrap">
            {message.text}
          </span>
        ) : (
          <MathMarkdown components={MARKDOWN_COMPONENTS}>
            {message.text}
          </MathMarkdown>
        )}
      </div>
    </div>
  );
}
