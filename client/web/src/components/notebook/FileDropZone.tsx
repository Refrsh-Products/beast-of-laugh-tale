import { useCallback, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { RiUploadCloud2Line } from "@remixicon/react";

interface FileDropZoneProps {
  /** Called with the dropped files once a drop lands inside the zone. */
  onFilesDropped: (files: File[]) => void;
  /** Suppresses the overlay and ignores drops, without letting the browser
   *  navigate to the dropped file. */
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

/**
 * Wraps a region so files dragged onto it are handed back via `onFilesDropped`,
 * showing a full-cover "Drop files to upload" overlay while a drag is in range.
 */
export default function FileDropZone({
  onFilesDropped,
  disabled = false,
  className,
  children,
}: FileDropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  // dragenter/dragleave fire again for every nested child the cursor crosses,
  // so track depth and only drop the overlay once the cursor has truly left.
  const dragDepth = useRef(0);

  const handleDragEnter = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;
      dragDepth.current++;
      if (e.dataTransfer.types.includes("Files")) setIsDragging(true);
    },
    [disabled],
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      if (disabled) return;
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setIsDragging(false);
    },
    [disabled],
  );

  // Required even when disabled: without it the browser refuses the drop and
  // opens the dropped file instead, navigating away from the app.
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragDepth.current = 0;
      setIsDragging(false);
      if (disabled) return;
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length) onFilesDropped(droppedFiles);
    },
    [disabled, onFilesDropped],
  );

  return (
    <div
      className={cn("relative", className)}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}

      {isDragging && !disabled && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="border-secondary bg-card flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed px-10 py-8 shadow-lg">
            <RiUploadCloud2Line className="text-secondary size-10" />
            <p className="text-foreground text-sm font-medium">
              Drop files to upload
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
