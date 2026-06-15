import { useEffect, useState } from "react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { BP_PHONE } from "../../constants/breakpoints";

const B = "#000000";
const W = "#FFFFFF";
const G = "#84e487";

interface UploadConfirmModalProps {
  files: File[];
  onConfirm: () => void;
  onCancel: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
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
    if (kind !== "pdf" && kind !== "image") {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
      setObjectUrl(null);
    };
  }, [file, kind]);

  useEffect(() => {
    if (kind !== "text") {
      setTextContent(null);
      return;
    }
    let cancelled = false;
    const reader = new FileReader();
    reader.onload = () => {
      if (!cancelled) {
        const text = String(reader.result ?? "");
        // Cap preview at 50k chars so huge files don't hang the UI
        setTextContent(text.length > 50000 ? text.slice(0, 50000) + "\n\n…" : text);
      }
    };
    reader.onerror = () => {
      if (!cancelled) setTextContent("[Failed to read file]");
    };
    reader.readAsText(file);
    return () => {
      cancelled = true;
      reader.abort();
    };
  }, [file, kind]);

  const wrapStyle: React.CSSProperties = {
    flex: 1,
    border: `1.5px solid ${B}`,
    background: "#fafafa",
    overflow: "hidden",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 0,
  };

  if (kind === "pdf" && objectUrl) {
    return (
      <div style={wrapStyle}>
        <iframe
          src={objectUrl}
          title={file.name}
          style={{ width: "100%", height: "100%", border: "none" }}
        />
      </div>
    );
  }

  if (kind === "image" && objectUrl) {
    return (
      <div style={wrapStyle}>
        <img
          src={objectUrl}
          alt={file.name}
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
        />
      </div>
    );
  }

  if (kind === "text") {
    return (
      <div style={{ ...wrapStyle, alignItems: "stretch" }}>
        <pre
          style={{
            margin: 0,
            padding: 12,
            width: "100%",
            height: "100%",
            overflow: "auto",
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.72rem",
            color: B,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {textContent ?? "Loading…"}
        </pre>
      </div>
    );
  }

  return (
    <div style={wrapStyle}>
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.75rem",
          color: "#666",
          textAlign: "center",
          padding: 16,
        }}
      >
        Preview not available for .{getExtension(file.name).toLowerCase()} files
      </span>
    </div>
  );
}

export default function UploadConfirmModal({
  files,
  onConfirm,
  onCancel,
}: UploadConfirmModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selected = files[selectedIndex] ?? files[0];
  const isPhone = useMediaQuery(BP_PHONE);

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: isPhone ? "stretch" : "center",
        justifyContent: "center",
        zIndex: 200,
      }}
    >
      <div
        style={{
          background: W,
          border: isPhone ? "none" : `2px solid ${B}`,
          boxShadow: isPhone ? "none" : `6px 6px 0 ${B}`,
          width: isPhone ? "100%" : "min(900px, 92vw)",
          height: isPhone ? "100dvh" : "min(640px, 88vh)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: `2px solid ${B}`,
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 12,
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "1.05rem",
              color: B,
            }}
          >
            Confirm upload — {files.length} file{files.length > 1 ? "s" : ""}
          </span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.72rem",
              color: "#555",
              letterSpacing: "0.04em",
            }}
          >
            {formatSize(totalBytes)} total
          </span>
        </div>

        {/* Body: file list + preview */}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: isPhone ? "1fr" : "280px 1fr",
            gridTemplateRows: isPhone ? "auto 1fr" : "1fr",
            minHeight: 0,
          }}
        >
          {/* Left: file list (top on phone) */}
          <div
            style={{
              borderRight: isPhone ? "none" : `2px solid ${B}`,
              borderBottom: isPhone ? `2px solid ${B}` : "none",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              maxHeight: isPhone ? 180 : undefined,
            }}
          >
            {files.map((file, i) => {
              const isActive = i === selectedIndex;
              return (
                <div
                  key={`${file.name}-${i}`}
                  onClick={() => setSelectedIndex(i)}
                  onMouseEnter={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLElement).style.background =
                        "#f0f0eb";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive)
                      (e.currentTarget as HTMLElement).style.background = W;
                  }}
                  style={{
                    padding: "10px 14px",
                    borderBottom: "1px solid #e0e0e0",
                    background: isActive ? G : W,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    gap: 4,
                    transition: "background 0.12s",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      color: B,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {file.name}
                  </span>
                  <div
                    style={{
                      display: "flex",
                      gap: 10,
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: "0.7rem",
                      color: "#555",
                    }}
                  >
                    <span>{getExtension(file.name)}</span>
                    <span>·</span>
                    <span>{formatSize(file.size)}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right: preview */}
          <div
            style={{
              padding: 14,
              display: "flex",
              flexDirection: "column",
              gap: 10,
              minHeight: 0,
            }}
          >
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.72rem",
                letterSpacing: "0.1em",
                color: "#555",
                fontWeight: 700,
              }}
            >
              PREVIEW
            </div>
            {selected && <FilePreview file={selected} />}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            padding: "14px 20px",
            borderTop: `2px solid ${B}`,
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
            flexShrink: 0,
          }}
        >
          <button
            onClick={onCancel}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translate(-3px, -3px)";
              e.currentTarget.style.boxShadow = `3px 3px 0 ${B}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = "none";
            }}
            style={{
              background: W,
              color: B,
              border: `2px solid ${B}`,
              padding: "10px 18px",
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 700,
              fontSize: "0.78rem",
              cursor: "pointer",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translate(-3px, -3px)";
              e.currentTarget.style.boxShadow = `6px 6px 0 ${B}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "none";
              e.currentTarget.style.boxShadow = `3px 3px 0 ${B}`;
            }}
            style={{
              background: G,
              color: B,
              border: `2px solid ${B}`,
              boxShadow: `3px 3px 0 ${B}`,
              padding: "10px 18px",
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 700,
              fontSize: "0.78rem",
              cursor: "pointer",
              transition: "transform 0.15s, box-shadow 0.15s",
            }}
          >
            Confirm upload
          </button>
        </div>
      </div>
    </div>
  );
}
