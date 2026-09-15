import { useCallback } from "react";

/**
 * Renders a local image File.
 *
 * The object URL is owned by the <img> node itself: React 19 runs the cleanup
 * a ref callback returns when the node detaches, so a remount (StrictMode's
 * included) always creates a fresh URL instead of reusing a revoked one, and
 * nothing leaks when the image leaves the screen.
 */
export default function FileImagePreview({
  file,
  className,
}: {
  file: File;
  className?: string;
}) {
  const attachObjectUrl = useCallback(
    (node: HTMLImageElement | null) => {
      if (!node) return;
      const url = URL.createObjectURL(file);
      node.src = url;
      return () => URL.revokeObjectURL(url);
    },
    [file],
  );

  return <img ref={attachObjectUrl} alt={file.name} className={className} />;
}
