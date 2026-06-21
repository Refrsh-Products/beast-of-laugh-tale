import { useRef } from "react";
import { MoreHorizontal, Pin } from "lucide-react";
import type { Notebook } from "@freshr/shared";
import { cn } from "../../lib/utils";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

interface NotebookRowProps {
  notebook: Notebook;
  fileCount: number;
  openMenuId: string | null;
  onMenuOpen: (id: string | null, anchor?: { top: number; right: number }) => void;
  editingId: string | null;
  editValue: string;
  onEditChange: (val: string) => void;
  onEditConfirm: () => void;
  onEditCancel: () => void;
  onClick?: (notebook: Notebook) => void;
}

export default function NotebookRow({
  notebook,
  fileCount,
  openMenuId,
  onMenuOpen,
  editingId,
  editValue,
  onEditChange,
  onEditConfirm,
  onEditCancel,
  onClick,
}: NotebookRowProps) {
  const menuOpen = openMenuId === notebook.id;
  const isEditing = editingId === notebook.id;
  const escapeRef = useRef(false);

  return (
    <div
      onClick={() => !isEditing && onClick?.(notebook)}
      className={cn(
        "group flex items-center gap-3 rounded-md border px-4 py-3 transition-colors",
        isEditing || menuOpen
          ? "border-primary/50 cursor-default bg-secondary/30"
          : "border-transparent hover:bg-secondary/50 cursor-pointer",
      )}
    >
      {/* Pin */}
      <div className="w-4 shrink-0">
        {notebook.pinned && <Pin className="h-3 w-3 text-primary fill-primary" />}
      </div>

      {/* Title or rename */}
      {isEditing ? (
        <input
          autoFocus
          value={editValue}
          onChange={(e) => onEditChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onEditConfirm();
            } else if (e.key === "Escape") {
              escapeRef.current = true;
              e.currentTarget.blur();
            }
          }}
          onBlur={() => {
            if (escapeRef.current) {
              escapeRef.current = false;
              onEditCancel();
            } else {
              onEditConfirm();
            }
          }}
          onClick={(e) => e.stopPropagation()}
          className="flex-1 min-w-0 bg-transparent border-0 border-b border-primary text-sm font-medium text-foreground outline-none py-0.5"
        />
      ) : (
        <span className="flex-1 min-w-0 truncate text-sm font-medium text-foreground">
          {notebook.title}
        </span>
      )}

      <span className="shrink-0 text-xs text-muted-foreground">
        {fileCount} {fileCount === 1 ? "file" : "files"}
      </span>
      <span className="shrink-0 text-xs text-muted-foreground hidden sm:block">
        {formatDate(notebook.created_at)}
      </span>

      {!isEditing && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (menuOpen) {
              onMenuOpen(null);
              return;
            }
            const rect = e.currentTarget.getBoundingClientRect();
            onMenuOpen(notebook.id, {
              top: rect.bottom + 4,
              right: window.innerWidth - rect.right,
            });
          }}
          className={cn(
            "shrink-0 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-secondary hover:text-foreground",
            menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
          )}
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
