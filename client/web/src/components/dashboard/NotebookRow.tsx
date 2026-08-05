import { useRef } from "react";
import type { Notebook } from "@freshr/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  RiMore2Fill,
  RiPushpin2Fill,
  RiPushpin2Line,
  RiPencilLine,
  RiArchive2Line,
  RiDeleteBin6Line,
  RiBook2Line,
} from "@remixicon/react";
import { formatRelativeTime } from "@/lib/formatRelativeTime";
import type { NotebookCardActions } from "./NotebookCard";

export default function NotebookRow({
  notebook,
  fileCount,
  isEditing,
  editValue,
  onEditChange,
  onEditConfirm,
  onEditCancel,
  onClick,
  actions,
}: {
  notebook: Notebook;
  fileCount: number;
  isEditing: boolean;
  editValue: string;
  onEditChange: (val: string) => void;
  onEditConfirm: () => void;
  onEditCancel: () => void;
  onClick: () => void;
  actions: NotebookCardActions;
}) {
  const cancelledRef = useRef(false);
  // See NotebookCard: stops Radix blurring the inline rename input on close,
  // and stops that blur committing before the user has typed anything.
  const renamingRef = useRef(false);
  const interactedRef = useRef(false);

  return (
    <div
      className="bg-card border-border hover:border-primary/40 focus-within:ring-ring/50 relative flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors focus-within:ring-[3px]"
      data-testid="notebook-row"
    >
      <span className="bg-accent text-accent-foreground flex size-9 shrink-0 items-center justify-center rounded-md">
        <RiBook2Line className="size-4" aria-hidden="true" />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        {isEditing ? (
          <Input
            autoFocus
            value={editValue}
            aria-label="Notebook title"
            onChange={(e) => {
              interactedRef.current = true;
              onEditChange(e.target.value);
            }}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => {
              interactedRef.current = true;
              if (e.key === "Enter") {
                onEditConfirm();
              } else if (e.key === "Escape") {
                cancelledRef.current = true;
                onEditCancel();
              }
            }}
            onBlur={() => {
              if (cancelledRef.current) {
                cancelledRef.current = false;
                return;
              }
              if (!interactedRef.current) return;
              interactedRef.current = false;
              onEditConfirm();
            }}
            className="h-8"
          />
        ) : (
          <button type="button" onClick={onClick} className="cursor-pointer text-left">
            <span className="absolute inset-0" aria-hidden="true" />
            <span className="truncate font-semibold">{notebook.title}</span>
          </button>
        )}
        <span className="text-muted-foreground truncate text-xs">
          {fileCount} {fileCount === 1 ? "file" : "files"} · Edited{" "}
          {formatRelativeTime(notebook.updated_at)}
        </span>
      </div>

      {notebook.pinned && (
        <Badge className="relative hidden gap-1 sm:inline-flex">
          <RiPushpin2Fill className="size-3" aria-hidden="true" />
          Pinned
        </Badge>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Actions for ${notebook.title}`}
            // z-10 keeps the trigger above the title's stretched overlay.
            className="relative z-10 shrink-0"
          >
            <RiMore2Fill aria-hidden="true" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-44"
          onCloseAutoFocus={(event) => {
            if (renamingRef.current) {
              renamingRef.current = false;
              event.preventDefault();
            }
          }}
        >
          <DropdownMenuItem onSelect={actions.onPin}>
            {notebook.pinned ? (
              <RiPushpin2Line aria-hidden="true" />
            ) : (
              <RiPushpin2Fill aria-hidden="true" />
            )}
            {notebook.pinned ? "Unpin" : "Pin"}
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              renamingRef.current = true;
              actions.onRename();
            }}
          >
            <RiPencilLine aria-hidden="true" />
            Rename
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={actions.onArchive}>
            <RiArchive2Line aria-hidden="true" />
            Archive
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={actions.onDelete}>
            <RiDeleteBin6Line aria-hidden="true" />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
