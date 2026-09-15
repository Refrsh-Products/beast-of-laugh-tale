import { GlobalWorkerOptions, getDocument } from "pdfjs-dist";
// Vite resolves this to a hashed asset URL and copies the worker into the
// build; pdf.js refuses to render without one (it falls back to a "fake
// worker" that blocks the main thread and warns loudly).
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Render width in CSS-independent pixels. The upload tiles are ~320px wide at
 * their largest, so 2x that keeps the thumbnail crisp on retina displays
 * without paying for a full-resolution page raster.
 */
const THUMBNAIL_WIDTH = 640;

/**
 * Rasterises page 1 of a PDF into a PNG `data:` URL, for use as a preview
 * image. A data URL rather than an object URL because it needs no revoking:
 * the thumbnail is small, and its lifetime is simply that of whoever holds the
 * string.
 *
 * Import this module lazily (`await import("@/lib/pdfThumbnail")`) — pdf.js is
 * a large dependency and nothing else in the app needs it, so it should stay
 * out of the main bundle.
 */
export async function renderPdfFirstPage(file: File): Promise<string> {
  const data = await file.arrayBuffer();
  const loadingTask = getDocument({ data });

  try {
    const doc = await loadingTask.promise;
    const page = await doc.getPage(1);
    const unscaled = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({
      scale: THUMBNAIL_WIDTH / unscaled.width,
    });

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);

    const canvasContext = canvas.getContext("2d");
    if (!canvasContext) throw new Error("2D canvas context unavailable");

    // Left transparent on purpose: the tile behind it supplies the page
    // colour, so no colour literal has to live in here.
    await page.render({ canvas, canvasContext, viewport }).promise;

    return canvas.toDataURL("image/png");
  } finally {
    // Tears down the worker and frees the page raster held on its side.
    void loadingTask.destroy();
  }
}
