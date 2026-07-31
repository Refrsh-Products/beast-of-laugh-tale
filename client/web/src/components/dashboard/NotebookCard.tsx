import { useRef } from "react";
import type { Notebook } from "@freshr/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
  RiFileTextLine,
  RiQuillPenLine,
} from "@remixicon/react";
import { formatRelativeTime } from "@/lib/formatRelativeTime";

export interface NotebookCardActions {
  onPin: () => void;
  onRename: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

export default function NotebookCard({
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
  // Escape must cancel without the blur handler also committing the rename.
  const cancelledRef = useRef(false);
  // Set when Rename is chosen, so the menu can skip returning focus to its
  // trigger. Without this Radix blurs the freshly autofocused input on close.
  const renamingRef = useRef(false);
  // Blur only commits once the user has actually touched the field. Opening
  // rename from the menu can blur the input before anyone types — committing
  // there would close the editor instantly and save the unchanged title.
  const interactedRef = useRef(false);

  return (
    <Card
      className="group hover:border-primary/40 relative gap-0 overflow-hidden p-0 transition-colors focus-within:ring-[3px] focus-within:ring-ring/50"
      data-testid="notebook-card"
    >
      {/* Cover band — carries the pinned marker and gives the grid rhythm. */}
      <div className="from-accent to-muted relative h-16 bg-gradient-to-br">
        {notebook.pinned && (
          <Badge className="absolute top-2 right-2 gap-1">
            <RiPushpin2Fill className="size-3" aria-hidden="true" />
            Pinned
          </Badge>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
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
            <button
              type="button"
              onClick={onClick}
              className="cursor-pointer text-left"
            >
              {/* Stretched hit area: the whole card opens the notebook, while
                  the menu button above it stays independently clickable. */}
              <span className="absolute inset-0" aria-hidden="true" />
              <h3 className="line-clamp-2 leading-snug font-semibold tracking-[-0.01em]">
                {notebook.title}
              </h3>
            </button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${notebook.title}`}
                // z-10 keeps the trigger above the title's stretched overlay.
                // Without an explicit layer this relies on DOM order alone, and
                // a click near the trigger's edge opens the notebook instead.
                className="relative z-10 shrink-0"
              >
                <RiMore2Fill aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="w-44"
              onCloseAutoFocus={(event) => {
                // Every other action leaves focus to Radix; only rename needs
                // it left alone so the inline input keeps it.
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

        <div className="text-muted-foreground mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
          <span className="flex items-center gap-1">
            <RiFileTextLine className="size-3.5" aria-hidden="true" />
            {fileCount} {fileCount === 1 ? "file" : "files"}
          </span>
          <span className="flex items-center gap-1">
            <RiQuillPenLine className="size-3.5" aria-hidden="true" />
            Edited {formatRelativeTime(notebook.updated_at)}
          </span>
        </div>
      </div>
    </Card>
  );
}
