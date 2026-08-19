import type { ReactNode } from "react";

/**
 * Markdown overrides at *document* scale — long-form legal and policy copy.
 *
 * Distinct from the compact set the chat bubbles and generated notes use
 * (see ChatMessage / AudioColumn): those render short conversational replies
 * inside a narrow column, so their headings and spacing are deliberately
 * tighter. This set is for a full page of prose.
 *
 * Defined at module scope so the object identity is stable across renders.
 */
export const DOCUMENT_MARKDOWN = {
  h1: ({ children }: { children?: ReactNode }) => (
    <h2 className="font-heading text-foreground mt-8 mb-2.5 text-2xl leading-tight font-bold tracking-tight">
      {children}
    </h2>
  ),
  h2: ({ children }: { children?: ReactNode }) => (
    <h3 className="font-heading text-foreground mt-6 mb-2 text-lg leading-tight font-bold">
      {children}
    </h3>
  ),
  h3: ({ children }: { children?: ReactNode }) => (
    <h4 className="text-foreground mt-5 mb-1.5 text-base font-semibold tracking-[0.04em]">
      {children}
    </h4>
  ),
  p: ({ children }: { children?: ReactNode }) => (
    <p className="mb-4 leading-relaxed">{children}</p>
  ),
  strong: ({ children }: { children?: ReactNode }) => (
    <strong className="font-semibold">{children}</strong>
  ),
  em: ({ children }: { children?: ReactNode }) => (
    <em className="italic">{children}</em>
  ),
  ul: ({ children }: { children?: ReactNode }) => (
    <ul className="my-3 list-disc pl-6">{children}</ul>
  ),
  ol: ({ children }: { children?: ReactNode }) => (
    <ol className="my-3 list-decimal pl-6">{children}</ol>
  ),
  li: ({ children }: { children?: ReactNode }) => (
    <li className="mb-1.5 leading-relaxed">{children}</li>
  ),
  a: ({ children, href }: { children?: ReactNode; href?: string }) => (
    <a
      href={href}
      className="text-primary font-semibold underline underline-offset-[3px] hover:no-underline"
    >
      {children}
    </a>
  ),
  hr: () => <hr className="border-border my-8" />,
  blockquote: ({ children }: { children?: ReactNode }) => (
    <blockquote className="border-primary text-muted-foreground my-4 border-l-[3px] py-1.5 pl-4">
      {children}
    </blockquote>
  ),
  // Policy documents carry wide comparison tables; they scroll inside their
  // own container so the page body never scrolls sideways.
  table: ({ children }: { children?: ReactNode }) => (
    <div className="border-border my-5 overflow-x-auto rounded-2xl border">
      <table className="w-full border-collapse text-sm">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: ReactNode }) => (
    <thead className="bg-muted text-foreground">{children}</thead>
  ),
  tbody: ({ children }: { children?: ReactNode }) => <tbody>{children}</tbody>,
  tr: ({ children }: { children?: ReactNode }) => (
    <tr className="border-border border-b last:border-b-0">{children}</tr>
  ),
  th: ({ children }: { children?: ReactNode }) => (
    <th className="px-3 py-2.5 text-left font-semibold tracking-[0.04em]">
      {children}
    </th>
  ),
  td: ({ children }: { children?: ReactNode }) => (
    <td className="px-3 py-2.5 align-top leading-relaxed">{children}</td>
  ),
};
