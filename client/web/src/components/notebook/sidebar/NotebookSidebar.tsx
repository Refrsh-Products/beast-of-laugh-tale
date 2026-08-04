import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * The notebook's second column: a contextual panel that swaps with the active
 * tool, above a materials list that never unmounts.
 *
 * Both regions scroll independently and share the height, so a long chat
 * history can't push the file list off-screen — the files are the one thing a
 * user needs reachable from every tool.
 */
export default function NotebookSidebar({
  contextPanel,
  materialsPanel,
  className,
}: {
  contextPanel: ReactNode;
  materialsPanel: ReactNode;
  /**
   * Fixed width as a desktop column; inside the mobile drawer it has to fill
   * whatever the rail leaves behind, or its action buttons get clipped.
   */
  className?: string;
}) {
  return (
    <aside
      className={cn(
        "bg-card border-border flex h-full flex-col overflow-hidden border-r",
        className ?? "w-72 shrink-0",
      )}
    >
      <div className="flex min-h-0 flex-1 flex-col">{contextPanel}</div>
      <div className="flex min-h-0 flex-1 flex-col">{materialsPanel}</div>
    </aside>
  );
}
