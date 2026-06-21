import { useState, useRef } from "react";
import { Upload, Check, X, Loader2 } from "lucide-react";
import type { NotebookFile } from "@freshr/shared";
import FileItem from "./FileItem";
import UploadConfirmModal from "./UploadConfirmModal";
import Button from "../ui/Button";
import { ACCEPTED_FILE_TYPES } from "../../lib/constants";
import { cn } from "../../lib/utils";

export interface FileUploadState {
  name: string;
  status: "uploading" | "done" | "error";
  error?: string;
}

interface FilesColumnProps {
  files: NotebookFile[];
  onUpload: (files: File[]) => void;
  onDeleteSelected: (ids: string[]) => void;
  onDeleteOne: (id: string) => void;
  onRename: (id: string, newName: string) => void;
  uploadProgress?: FileUploadState[];
}

function UploadProgressItem({ item }: { item: FileUploadState }) {
  return (
    <div
      className={cn(
        "flex items-start gap-2 px-3 py-2 rounded-sm border text-xs",
        item.status === "error"
          ? "bg-destructive/10 border-destructive/30"
          : item.status === "done"
            ? "bg-primary/10 border-primary/30"
            : "bg-secondary/50 border-border",
      )}
    >
      {item.status === "uploading" && <Loader2 className="h-3.5 w-3.5 text-muted-foreground animate-spin shrink-0 mt-0.5" />}
      {item.status === "done" && <Check className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />}
      {item.status === "error" && <X className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />}
      <div className="flex-1 min-w-0 overflow-hidden">
        <span className="block truncate text-foreground">{item.name}</span>
        {item.status === "error" && item.error && (
          <span className="block text-destructive mt-0.5 leading-snug">{item.error}</span>
        )}
        {item.status === "uploading" && <span className="block text-muted-foreground mt-0.5">Uploading...</span>}
        {item.status === "done" && <span className="block text-muted-foreground mt-0.5">Processing</span>}
      </div>
    </div>
  );
}

export default function FilesColumn({
  files,
  onUpload,
  onDeleteSelected,
  onDeleteOne,
  onRename,
  uploadProgress = [],
}: FilesColumnProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingUpload, setPendingUpload] = useState<File[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped.length) setPendingUpload(dropped);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files ?? []);
    if (picked.length) setPendingUpload(picked);
    e.target.value = "";
  }

  function confirmUpload() {
    if (pendingUpload) onUpload(pendingUpload);
    setPendingUpload(null);
  }

  function toggleSelect(id: string) {
    setSelectedIds((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  }

  function toggleBulkMode() {
    setBulkMode((v) => { if (v) setSelectedIds([]); return !v; });
  }

  function confirmDelete() {
    onDeleteSelected(selectedIds);
    setBulkMode(false);
    setSelectedIds([]);
    setShowConfirm(false);
  }

  return (
    <div className="flex flex-col h-full bg-card border-l border-border overflow-hidden">
      {/* Header */}
      <div className="h-11 flex items-center justify-between px-4 border-b border-border shrink-0">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Files</span>
        {files.length > 0 && (
          <div className="flex items-center gap-2">
            {bulkMode && selectedIds.length > 0 && (
              <Button variant="danger" onClick={() => setShowConfirm(true)}>
                Delete ({selectedIds.length})
              </Button>
            )}
            <button
              onClick={toggleBulkMode}
              title="Bulk delete"
              className={cn(
                "w-4 h-4 rounded-sm border border-destructive/50 flex items-center justify-center transition-colors",
                bulkMode ? "bg-destructive/20" : "hover:bg-destructive/10",
              )}
            >
              {bulkMode && <Check className="h-2.5 w-2.5 text-destructive" />}
            </button>
          </div>
        )}
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "m-3 rounded-md border-2 border-dashed flex flex-col items-center justify-center gap-1.5 py-4 cursor-pointer transition-all shrink-0",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/40 hover:bg-secondary/30",
        )}
      >
        <Upload className={cn("h-5 w-5", isDragging ? "text-primary" : "text-muted-foreground")} />
        <span className={cn("text-xs text-center leading-relaxed", isDragging ? "text-primary" : "text-muted-foreground")}>
          Drop files here<br />or click to upload
        </span>
        <input ref={fileInputRef} type="file" multiple accept={ACCEPTED_FILE_TYPES} onChange={handleFileInput} className="hidden" />
      </div>

      {/* File list */}
      <div className="flex-1 overflow-y-auto flex flex-col gap-0.5 px-2 pb-3">
        {uploadProgress.map((item, i) => (
          <UploadProgressItem key={`upload-${i}`} item={item} />
        ))}
        {files.length === 0 && uploadProgress.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center mt-3">No files yet</p>
        ) : (
          files.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              bulkMode={bulkMode}
              selected={selectedIds.includes(file.id)}
              onToggleSelect={toggleSelect}
              onDelete={onDeleteOne}
              onRename={onRename}
            />
          ))
        )}
      </div>

      {pendingUpload && (
        <UploadConfirmModal files={pendingUpload} onConfirm={confirmUpload} onCancel={() => setPendingUpload(null)} />
      )}

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-xs rounded-lg border border-border bg-card p-6 shadow-xl">
            <p className="text-base font-semibold text-foreground mb-1">
              Delete {selectedIds.length} file{selectedIds.length > 1 ? "s" : ""}?
            </p>
            <p className="text-sm text-muted-foreground mb-5">This cannot be undone.</p>
            <div className="flex gap-2">
              <Button variant="danger" fullWidth onClick={confirmDelete}>Delete</Button>
              <Button variant="default" fullWidth onClick={() => setShowConfirm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
