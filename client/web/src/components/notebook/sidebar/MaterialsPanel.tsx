import { useRef, useState } from "react";
import type { NotebookFile } from "@freshr/shared";
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
  RiUploadCloud2Line,
  RiMoreLine,
  RiPencilLine,
  RiDeleteBin6Line,
  RiFileTextLine,
  RiLoader4Line,
  RiErrorWarningLine,
} from "@remixicon/react";
import { ACCEPTED_FILE_TYPES } from "@/lib/constants";
import { SidebarEmpty, SidebarSection } from "./SidebarSection";

export interface FileUploadState {
  name: string;
  status: "uploading" | "done" | "error";
  error?: string;
}

/**
 * The notebook's source materials. Unlike the panel above it, this stays
 * mounted for every tool — the files are what all four of them operate on.
 */
export default function MaterialsPanel({
  files,
  uploadProgress = [],
  onUpload,
  onDeleteOne,
  onRename,
  disabled = false,
}: {
  files: NotebookFile[];
  uploadProgress?: FileUploadState[];
  onUpload: (files: File[]) => void;
  onDeleteOne: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftName, setDraftName] = useState("");
  const cancelledRef = useRef(false);
  const interactedRef = useRef(false);
  const renamingRef = useRef(false);

  function startRename(file: NotebookFile) {
    renamingRef.current = true;
    interactedRef.current = false;
    setEditingId(file.id);
    setDraftName(file.name);
  }

  function commitRename(id: string) {
    const trimmed = draftName.trim();
    setEditingId(null);
    if (trimmed) onRename(id, trimmed);
  }

  const inFlight = uploadProgress.filter((u) => u.status !== "done");

  return (
    <SidebarSection
      title="Notebook materials"
      className="border-border border-t"
      action={
        <Button
          size="sm"
          className="w-full"
          aria-label="Upload files"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
        >
          <RiUploadCloud2Line aria-hidden="true" /> Upload Notes
        </Button>
      }
    >
      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        accept={ACCEPTED_FILE_TYPES}
        onChange={(e) => {
          const picked = Array.from(e.target.files ?? []);
          if (picked.length) onUpload(picked);
          // Reset so picking the same file twice still fires a change event.
          e.target.value = "";
        }}
      />

      {files.length === 0 && inFlight.length === 0 ? (
        <SidebarEmpty>
          No files yet. Upload notes or a syllabus to unlock the tools.
        </SidebarEmpty>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {inFlight.map((upload) => (
            <li
              key={upload.name}
              className="text-muted-foreground flex items-center gap-2 px-2 py-2 text-sm"
            >
              {upload.status === "error" ? (
                <RiErrorWarningLine
                  className="text-destructive size-4 shrink-0"
                  aria-hidden="true"
                />
              ) : (
                <RiLoader4Line
                  className="size-4 shrink-0 animate-spin"
                  aria-hidden="true"
                />
              )}
              <span className="truncate">{upload.name}</span>
            </li>
          ))}

          {files.map((file) => (
            <li key={file.id} className="group/file relative">
              {editingId === file.id ? (
                <Input
                  autoFocus
                  value={draftName}
                  aria-label="File name"
                  className="h-8"
                  onChange={(e) => {
                    interactedRef.current = true;
                    setDraftName(e.target.value);
                  }}
                  onKeyDown={(e) => {
                    interactedRef.current = true;
                    if (e.key === "Enter") commitRename(file.id);
                    if (e.key === "Escape") {
                      cancelledRef.current = true;
                      setEditingId(null);
                    }
                  }}
                  onBlur={() => {
                    if (cancelledRef.current) {
                      cancelledRef.current = false;
                      return;
                    }
                    if (!interactedRef.current) return;
                    interactedRef.current = false;
                    commitRename(file.id);
                  }}
                />
              ) : (
                <div className="flex items-center gap-2 rounded-md px-2 py-2 pr-8 text-sm">
                  <RiFileTextLine
                    className="text-muted-foreground size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1 truncate">{file.name}</span>
                  {file.ingestion_status !== "ready" && (
                    <Badge
                      variant={
                        file.ingestion_status === "failed"
                          ? "destructive"
                          : "outline"
                      }
                      className="shrink-0 px-1.5 py-0 text-[0.65rem]"
                    >
                      {file.ingestion_status}
                    </Badge>
                  )}
                </div>
              )}

              {editingId !== file.id && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Actions for ${file.name}`}
                      className="absolute top-1/2 right-1 z-10 -translate-y-1/2 opacity-0 focus-visible:opacity-100 group-hover/file:opacity-100"
                    >
                      <RiMoreLine aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    className="w-40"
                    onCloseAutoFocus={(event) => {
                      if (renamingRef.current) {
                        renamingRef.current = false;
                        event.preventDefault();
                      }
                    }}
                  >
                    <DropdownMenuItem
                      disabled={disabled}
                      onSelect={() => startRename(file)}
                    >
                      <RiPencilLine aria-hidden="true" />
                      Rename
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      variant="destructive"
                      disabled={disabled}
                      onSelect={() => onDeleteOne(file.id)}
                    >
                      <RiDeleteBin6Line aria-hidden="true" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </li>
          ))}
        </ul>
      )}
    </SidebarSection>
  );
}
