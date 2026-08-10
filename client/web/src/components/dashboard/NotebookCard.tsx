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

interface NotebookCardProps {
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

export default function NotebookCard({
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
}: NotebookCardProps) {
  const menuOpen = openMenuId === notebook.id;
  const isEditing = editingId === notebook.id;
  const escapeRef = useRef(false);

  return (
    <div
      onClick={() => !isEditing && onClick?.(notebook)}
      className={cn(
        "group relative flex h-36 flex-col justify-between rounded-lg border bg-card p-4 transition-all duration-150",
        isEditing || menuOpen
          ? "border-primary/50 cursor-default"
          : "border-border hover:border-border/60 hover:bg-card/80 cursor-pointer",
      )}
    >
      {/* Top row: pin + menu */}
      <div className="flex items-start justify-between">
        <div className="w-4">
          {notebook.pinned && <Pin className="h-3 w-3 text-primary fill-primary" />}
        </div>

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
            aria-label="Open notebook menu"
            className={cn(
              "flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-all hover:bg-secondary hover:text-foreground",
              menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Title or rename input */}
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
          className="flex-1 bg-transparent border-0 border-b border-primary text-sm font-medium text-foreground outline-none py-0.5"
        />
      ) : (
        <p className="flex-1 text-sm font-medium text-foreground line-clamp-2 mt-1">
          {notebook.title}
        </p>
      )}

      {/* Bottom row: date + file count */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Created {formatDate(notebook.created_at)}</span>
        <span>{fileCount} {fileCount === 1 ? "file" : "files"}</span>
      </div>
    </div>
  );
}
