import { type ReactNode, useState } from "react";
import { cn } from "@/lib/utils";
import { RiArrowDownSLine } from "@remixicon/react";

/**
 * The notebook's second column: a contextual panel that swaps with the active
 * tool, above a materials list that never unmounts.
 *
 * Each panel can be collapsed to just its header, giving the other panel
 * the full height. When collapsed the action slot and body are hidden.
 */
export default function NotebookSidebar({
  contextPanel,
  contextTitle,
  materialsPanel,
  className,
}: {
  contextPanel: ReactNode;
  contextTitle: string;
  materialsPanel: ReactNode;
  /**
   * Fixed width as a desktop column; inside the mobile drawer it has to fill
   * whatever the rail leaves behind, or its action buttons get clipped.
   */
  className?: string;
}) {
  const [contextCollapsed, setContextCollapsed] = useState(false);
  const [materialsCollapsed, setMaterialsCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "bg-card border-border flex h-full flex-col overflow-hidden border-r",
        className ?? "w-72 shrink-0",
      )}
    >
      {/* Context panel (tool-specific: chats, quizzes, etc.) */}
      <div
        className={cn(
          "flex flex-col",
          contextCollapsed ? "shrink-0" : "min-h-0 flex-1",
        )}
      >
        <button
          type="button"
          onClick={() => setContextCollapsed((c) => !c)}
          className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 px-4 pt-4 pb-2 text-xs font-semibold tracking-widest uppercase transition-colors"
          aria-expanded={!contextCollapsed}
        >
          <RiArrowDownSLine
            className={cn(
              "size-4 shrink-0 transition-transform",
              contextCollapsed && "-rotate-90",
            )}
            aria-hidden="true"
          />
          {contextTitle}
        </button>
        {!contextCollapsed && (
          <div className="flex min-h-0 flex-1 flex-col">{contextPanel}</div>
        )}
      </div>

      {/* Materials panel (always present, every tool operates on files) */}
      <div
        className={cn(
          "border-border flex flex-col border-t",
          materialsCollapsed ? "shrink-0" : "min-h-0 flex-1",
        )}
      >
        <button
          type="button"
          onClick={() => setMaterialsCollapsed((c) => !c)}
          className="text-muted-foreground hover:text-foreground flex cursor-pointer items-center gap-1 px-4 pt-4 pb-2 text-xs font-semibold tracking-widest uppercase transition-colors"
          aria-expanded={!materialsCollapsed}
        >
          <RiArrowDownSLine
            className={cn(
              "size-4 shrink-0 transition-transform",
              materialsCollapsed && "-rotate-90",
            )}
            aria-hidden="true"
          />
          Notebook materials
        </button>
        {!materialsCollapsed && (
          <div className="flex min-h-0 flex-1 flex-col">{materialsPanel}</div>
        )}
      </div>
    </aside>
  );
}
