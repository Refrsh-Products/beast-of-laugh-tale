import { useEffect, useRef, useState } from "react";

export const isPdfFile = (file: File) =>
  file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

/**
 * Rasterises the first page of every PDF in `files`, keyed by the File itself.
 *
 * The thumbnails are `data:` URLs, so they need no revoking and survive a
 * StrictMode double-invoked effect — an object URL here would be revoked by
 * the cleanup between the two invocations and never recreated, which renders
 * as a broken image. Results are cached across runs so removing one staged
 * file doesn't re-rasterise the rest.
 *
 * A PDF that cannot be rendered simply gets no entry; callers fall back to a
 * file-type icon.
 */
export function usePdfThumbnails(files: File[]): Map<File, string> {
  const cache = useRef(new Map<File, string>());
  const [thumbnails, setThumbnails] = useState<Map<File, string>>(new Map());

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const pending = files.filter(
        (file) => isPdfFile(file) && !cache.current.has(file),
      );
      if (pending.length === 0) return;

      let renderPdfFirstPage: typeof import("@/lib/pdfThumbnail").renderPdfFirstPage;
      try {
        ({ renderPdfFirstPage } = await import("@/lib/pdfThumbnail"));
      } catch (error) {
        // pdf.js could not be loaded at all (offline, blocked chunk). Every
        // PDF keeps its file-type icon; nothing else depends on it.
        console.warn("Could not load the PDF preview renderer", error);
        return;
      }

      for (const file of pending) {
        try {
          const url = await renderPdfFirstPage(file);
          // Cached even when this run was superseded, so the effect that
          // replaced it reads the result instead of rasterising again.
          cache.current.set(file, url);
          if (cancelled) continue;
          setThumbnails(new Map(cache.current));
        } catch (error) {
          // Encrypted, corrupt or otherwise unrenderable — not worth surfacing
          // to the user, who still gets the file name, type and size.
          console.warn(`Could not render a preview for ${file.name}`, error);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [files]);

  return thumbnails;
}
