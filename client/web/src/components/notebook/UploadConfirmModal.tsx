import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  RiDeleteBin6Line,
  RiUploadCloud2Line,
  RiFileTextLine,
  RiFilePdf2Line,
  RiFileWord2Line,
  RiFilePpt2Line,
  RiFileExcel2Line,
  RiImageLine,
  RiMarkdownLine,
} from "@remixicon/react";
import { usePdfThumbnails } from "@/hooks/usePdfThumbnails";
import FileImagePreview from "./FileImagePreview";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileExtLabel(name: string): string {
  const dot = name.lastIndexOf(".");
  if (dot === -1) return "File";
  return name.slice(dot + 1).toUpperCase();
}

function getFileIconConfig(name: string): {
  Icon: typeof RiFileTextLine;
  color: string;
  bg: string;
} {
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  switch (ext) {
    case "pdf":
      return { Icon: RiFilePdf2Line, color: "text-red-600", bg: "bg-red-50 dark:bg-red-950/40" };
    case "doc":
    case "docx":
      return { Icon: RiFileWord2Line, color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-950/40" };
    case "ppt":
    case "pptx":
      return { Icon: RiFilePpt2Line, color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-950/40" };
    case "xls":
    case "xlsx":
      return { Icon: RiFileExcel2Line, color: "text-green-600", bg: "bg-green-50 dark:bg-green-950/40" };
    case "md":
      return { Icon: RiMarkdownLine, color: "text-muted-foreground", bg: "bg-muted" };
    case "jpg":
    case "jpeg":
    case "png":
    case "webp":
    case "tiff":
    case "bmp":
      return { Icon: RiImageLine, color: "text-violet-500", bg: "bg-violet-50 dark:bg-violet-950/40" };
    default:
      return { Icon: RiFileTextLine, color: "text-muted-foreground", bg: "bg-muted" };
  }
}

/** Small uppercase mono labels used for the pane and summary metadata. */
const META_LABEL = "font-mono text-[0.6875rem] tracking-wider uppercase";

export default function UploadConfirmModal({
  files,
  onConfirm,
  onClose,
}: {
  files: File[];
  onConfirm: (files: File[]) => void;
  onClose: () => void;
}) {
  const [staged, setStaged] = useState<File[]>(() => [...files]);
  const [selected, setSelected] = useState<File | null>(() => files[0] ?? null);

  // PDFs get their first page rasterised; images preview straight off the File
  // (see FileImagePreview). Anything else falls back to the file-type icon.
  const pdfThumbnails = usePdfThumbnails(staged);

  function removeFile(file: File) {
    // Removing the last staged file leaves nothing to confirm, so treat it as
    // a cancel rather than parking the user on an empty dialog.
    if (staged.length === 1) {
      onClose();
      return;
    }

    const index = staged.indexOf(file);
    const next = staged.filter((candidate) => candidate !== file);
    setStaged(next);
    // Keep the preview pane on the row that slid into the removed one's place.
    if (selected === file) {
      setSelected(next[Math.min(index, next.length - 1)] ?? null);
    }
  }

  const totalBytes = staged.reduce((sum, file) => sum + file.size, 0);
  const selectedIndex = selected ? staged.indexOf(selected) : -1;
  const selectedIcon = getFileIconConfig(selected?.name ?? "");
  const selectedPdfPage = selected ? pdfThumbnails.get(selected) : undefined;
  const selectedIsImage = selected?.type.startsWith("image/") ?? false;

  return (
    <Dialog open onOpenChange={(next) => !next && onClose()}>
      {/* Header and footer are pinned; only the middle band scrolls, so the
          dialog stays inside short viewports. */}
      <DialogContent className="max-h-[90dvh] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="border-border/70 border-b px-6 py-4">
          <DialogTitle className="text-lg">Upload preview</DialogTitle>
          <DialogDescription className="sr-only">
            {`Review the ${staged.length} file${staged.length === 1 ? "" : "s"} you are about to upload, and remove any you did not mean to add.`}
          </DialogDescription>
        </DialogHeader>

        <div className="freshr-scroll grid gap-4 overflow-y-auto p-6 sm:grid-cols-[minmax(0,1fr)_17rem]">
          {/* Preview pane for the selected file */}
          <div className="border-border/70 bg-muted/30 flex min-h-56 flex-col overflow-hidden rounded-2xl border sm:min-h-72">
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-5 text-center">
              {selectedIsImage && selected ? (
                <FileImagePreview
                  file={selected}
                  className="max-h-56 max-w-full rounded-lg object-contain"
                />
              ) : selectedPdfPage ? (
                <img
                  src={selectedPdfPage}
                  alt={`First page of ${selected?.name}`}
                  // A rendered PDF page is transparent, so the sheet itself
                  // supplies the paper white in either theme.
                  className="max-h-56 max-w-full rounded-sm bg-white object-contain shadow-sm"
                />
              ) : (
                <div
                  className={`${selectedIcon.bg} flex size-24 items-center justify-center rounded-2xl`}
                >
                  <selectedIcon.Icon
                    className={`${selectedIcon.color} size-10`}
                    aria-hidden="true"
                  />
                </div>
              )}

              <div className="min-w-0 max-w-full">
                <p className="text-foreground truncate text-sm font-medium">
                  {selected?.name}
                </p>
                <p className="text-muted-foreground mt-0.5 text-xs">
                  Ready to upload
                </p>
              </div>
            </div>

            <div
              className={`${META_LABEL} border-border/70 text-muted-foreground flex items-center justify-between border-t px-4 py-2.5`}
            >
              <span>Preview mode</span>
              <span>
                {selectedIndex + 1} / {staged.length} files
              </span>
            </div>
          </div>

          {/* File list + totals */}
          <div className="flex min-w-0 flex-col gap-3">
            <ul className="freshr-scroll -mr-1 flex max-h-64 flex-col gap-2 overflow-y-auto pr-1">
              {staged.map((file) => {
                const iconCfg = getFileIconConfig(file.name);
                const isSelected = file === selected;

                return (
                  <li key={`${file.name}-${file.size}-${file.lastModified}`} className="relative">
                    <button
                      type="button"
                      aria-pressed={isSelected}
                      aria-label={`Preview ${file.name}`}
                      onClick={() => setSelected(file)}
                      className={`focus-visible:ring-ring/50 flex w-full items-center gap-2.5 rounded-xl border py-2 pr-10 pl-2.5 text-left transition-colors outline-none focus-visible:ring-[3px] ${
                        isSelected
                          ? "border-primary bg-accent/60"
                          : "border-border/70 hover:bg-muted/50"
                      }`}
                    >
                      <span
                        className={`${iconCfg.bg} flex size-8 shrink-0 items-center justify-center rounded-lg`}
                      >
                        <iconCfg.Icon
                          className={`${iconCfg.color} size-4`}
                          aria-hidden="true"
                        />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="text-foreground block truncate text-xs font-medium">
                          {file.name}
                        </span>
                        <span className="text-muted-foreground block text-[0.6875rem]">
                          {getFileExtLabel(file.name)}
                          <span className="mx-1 opacity-40">&middot;</span>
                          {formatFileSize(file.size)}
                        </span>
                      </span>
                    </button>

                    <Button
                      variant="ghost"
                      size="icon-xs"
                      aria-label={`Remove ${file.name}`}
                      onClick={() => removeFile(file)}
                      className="text-muted-foreground hover:bg-destructive/10 hover:text-destructive absolute top-1/2 right-2 -translate-y-1/2"
                    >
                      <RiDeleteBin6Line aria-hidden="true" />
                    </Button>
                  </li>
                );
              })}
            </ul>

            <dl
              className={`${META_LABEL} border-border/70 text-muted-foreground mt-auto space-y-1.5 border-t pt-3`}
            >
              <div className="flex items-center justify-between gap-2">
                <dt>Total files</dt>
                <dd className="text-foreground">{staged.length}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt>Total size</dt>
                <dd className="text-foreground">{formatFileSize(totalBytes)}</dd>
              </div>
            </dl>
          </div>
        </div>

        <DialogFooter className="border-border/70 border-t px-6 py-4">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={staged.length === 0}
            onClick={() => onConfirm(staged)}
          >
            <RiUploadCloud2Line className="size-4" aria-hidden="true" />
            Start upload
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
