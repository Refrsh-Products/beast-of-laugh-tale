import { useState, useRef } from "react";
import { FileText, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import type { NotebookFile } from "@freshr/shared";
import { cn } from "../../lib/utils";

interface FileItemProps {
  file: NotebookFile;
  bulkMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newName: string) => void;
}

export default function FileItem({
  file,
  bulkMode,
  selected,
  onToggleSelect,
  onDelete,
  onRename,
}: FileItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(file.name);
  const renameInputRef = useRef<HTMLInputElement>(null);

  function handleDotsClick(e: React.MouseEvent) {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, left: rect.right - 128 });
    setMenuOpen(true);
  }

  function closeMenu() {
    setMenuOpen(false);
    setMenuPos(null);
  }

  function handleRenameClick() {
    closeMenu();
    setRenameValue(file.name);
    setIsRenaming(true);
    setTimeout(() => {
      renameInputRef.current?.focus();
      renameInputRef.current?.select();
    }, 0);
  }

  function submitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== file.name) onRename(file.id, trimmed);
    setIsRenaming(false);
  }

  function handleRenameKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") submitRename();
    if (e.key === "Escape") setIsRenaming(false);
  }

  const isProcessing =
    file.ingestion_status === "pending" || file.ingestion_status === "processing";

  return (
    <>
      <div
        onClick={() => bulkMode && onToggleSelect(file.id)}
        className={cn(
          "group flex items-center gap-2 px-3 py-2 rounded-sm transition-colors",
          bulkMode && "cursor-pointer",
          selected ? "bg-destructive/10" : "hover:bg-secondary/50",
        )}
      >
        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />

        {isRenaming ? (
          <input
            ref={renameInputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={submitRename}
            onKeyDown={handleRenameKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 min-w-0 bg-transparent border-0 border-b border-primary text-xs text-foreground outline-none py-0.5"
          />
        ) : (
          <span className="flex-1 min-w-0 truncate text-xs text-foreground">{file.name}</span>
        )}

        {bulkMode && (
          <input
            type="checkbox"
            checked={selected}
            onChange={() => onToggleSelect(file.id)}
            onClick={(e) => e.stopPropagation()}
            className="cursor-pointer accent-destructive w-3.5 h-3.5 shrink-0"
          />
        )}

        {isProcessing && (
          <div className="w-3 h-3 rounded-full border border-border border-t-muted-foreground animate-spin shrink-0" title="Processing..." />
        )}

        {file.ingestion_status === "failed" && (
          <div
            className="w-3 h-3 rounded-full bg-destructive shrink-0"
            title={file.ingestion_error || "Ingestion failed"}
          />
        )}

        {!bulkMode && !isRenaming && (
          <button
            onClick={handleDotsClick}
            aria-label="File options"
            className={cn(
              "flex items-center justify-center h-5 w-5 rounded text-muted-foreground hover:text-foreground hover:bg-secondary transition-all shrink-0",
              menuOpen ? "opacity-100" : "opacity-0 group-hover:opacity-100",
            )}
          >
            <MoreVertical className="h-3 w-3" />
          </button>
        )}
      </div>

      {menuOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[199]" onClick={closeMenu} />
          <div
            style={{ top: menuPos?.top, left: menuPos?.left }}
            className="fixed z-[200] w-32 overflow-hidden rounded-md border border-border bg-popover shadow-lg"
          >
            <button
              onClick={(e) => { e.stopPropagation(); handleRenameClick(); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-foreground hover:bg-secondary transition-colors text-left border-b border-border"
            >
              <Pencil className="h-3 w-3" />
              Rename
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); closeMenu(); onDelete(file.id); }}
              className="flex items-center gap-2 w-full px-3 py-2 text-xs text-destructive hover:bg-destructive/10 transition-colors text-left"
            >
              <Trash2 className="h-3 w-3" />
              Delete
            </button>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
