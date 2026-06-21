import { useEffect, useState } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { BP_PHONE } from "../../constants/breakpoints";
import { cn } from "../../lib/utils";
import Button from "../ui/Button";

interface UploadConfirmModalProps {
  files: File[];
  onConfirm: () => void;
  onCancel: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

function getExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1).toUpperCase() : "FILE";
}

function isPreviewable(file: File): "pdf" | "text" | "image" | null {
  const ext = getExtension(file.name).toLowerCase();
  if (ext === "pdf" || file.type === "application/pdf") return "pdf";
  if (ext === "txt" || file.type.startsWith("text/")) return "text";
  if (file.type.startsWith("image/")) return "image";
  return null;
}

function FilePreview({ file }: { file: File }) {
  const kind = isPreviewable(file);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (kind !== "pdf" && kind !== "image") { setObjectUrl(null); return; }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => { URL.revokeObjectURL(url); setObjectUrl(null); };
  }, [file, kind]);

  useEffect(() => {
    if (kind !== "text") { setTextContent(null); return; }
    let cancelled = false;
    const reader = new FileReader();
    reader.onload = () => {
      if (!cancelled) {
        const text = String(reader.result ?? "");
        // Cap preview at 50k chars so huge files don't hang the UI
        setTextContent(text.length > 50000 ? text.slice(0, 50000) + "\n\n…" : text);
      }
    };
    reader.onerror = () => { if (!cancelled) setTextContent("[Failed to read file]"); };
    reader.readAsText(file);
    return () => { cancelled = true; reader.abort(); };
  }, [file, kind]);

  const wrapClass = "flex-1 rounded-md border border-border bg-secondary/20 overflow-hidden flex items-center justify-center min-h-0";

  if (kind === "pdf" && objectUrl) {
    return (
      <div className={wrapClass}>
        <iframe src={objectUrl} title={file.name} className="w-full h-full border-none" />
      </div>
    );
  }
  if (kind === "image" && objectUrl) {
    return (
      <div className={wrapClass}>
        <img src={objectUrl} alt={file.name} className="max-w-full max-h-full object-contain" />
      </div>
    );
  }
  if (kind === "text") {
    return (
      <div className={cn(wrapClass, "items-stretch")}>
        <pre className="m-0 p-3 w-full h-full overflow-auto text-xs text-foreground whitespace-pre-wrap break-words leading-relaxed">
          {textContent ?? "Loading…"}
        </pre>
      </div>
    );
  }
  return (
    <div className={wrapClass}>
      <span className="text-xs text-muted-foreground text-center p-4">
        Preview not available for .{getExtension(file.name).toLowerCase()} files
      </span>
    </div>
  );
}

export default function UploadConfirmModal({ files, onConfirm, onCancel }: UploadConfirmModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = files[selectedIndex] ?? files[0];
  const isPhone = useMediaQuery(BP_PHONE);
  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div
        className={cn(
          "bg-card border border-border flex flex-col overflow-hidden rounded-lg shadow-xl",
          isPhone ? "w-full h-dvh rounded-none border-0" : "w-[min(900px,92vw)] h-[min(640px,88vh)]",
        )}
      >
        {/* Header */}
        <div className="flex items-baseline justify-between gap-3 px-5 py-4 border-b border-border shrink-0">
          <span className="text-sm font-semibold text-foreground">
            Confirm upload — {files.length} file{files.length > 1 ? "s" : ""}
          </span>
          <span className="text-xs text-muted-foreground">{formatSize(totalBytes)} total</span>
        </div>

        {/* Body */}
        <div
          className="flex-1 min-h-0"
          style={{
            display: "grid",
            gridTemplateColumns: isPhone ? "1fr" : "280px 1fr",
            gridTemplateRows: isPhone ? "auto 1fr" : "1fr",
          }}
        >
          {/* File list */}
          <div
            className={cn(
              "overflow-y-auto flex flex-col",
              isPhone ? "border-b border-border max-h-44" : "border-r border-border",
            )}
          >
            {files.map((file, i) => {
              const isActive = i === selectedIndex;
              return (
                <div
                  key={`${file.name}-${i}`}
                  onClick={() => setSelectedIndex(i)}
                  className={cn(
                    "flex flex-col gap-1 px-4 py-3 border-b border-border cursor-pointer transition-colors",
                    isActive ? "bg-primary/15" : "hover:bg-secondary/50",
                  )}
                >
                  <span className="text-xs font-medium text-foreground truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {getExtension(file.name)} · {formatSize(file.size)}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Preview */}
          <div className="p-4 flex flex-col gap-3 min-h-0">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Preview</span>
            {selected && <FilePreview file={selected} />}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-5 py-4 border-t border-border shrink-0">
          <Button variant="default" onClick={onCancel}>Cancel</Button>
          <Button variant="green" onClick={onConfirm}>Confirm upload</Button>
        </div>
      </div>
    </div>
  );
}
