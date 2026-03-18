import type { NotebookFile } from "../../storage";

const B = "#000000";
const R = "#FF4D4D";

interface FileItemProps {
  file: NotebookFile;
  deleteMode: boolean;
  selected: boolean;
  onToggleSelect: (id: string) => void;
}

function FileIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      style={{ flexShrink: 0 }}
    >
      <rect
        x="2"
        y="1"
        width="9"
        height="13"
        rx="1"
        fill="#f0f0f0"
        stroke={B}
        strokeWidth="1.5"
      />
      <path
        d="M8 1v4h3"
        stroke={B}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <line
        x1="4"
        y1="8"
        x2="10"
        y2="8"
        stroke={B}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
      <line
        x1="4"
        y1="10.5"
        x2="8"
        y2="10.5"
        stroke={B}
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function FileItem({
  file,
  deleteMode,
  selected,
  onToggleSelect,
}: FileItemProps) {
  return (
    <div
      onClick={() => deleteMode && onToggleSelect(file.id)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 10px",
        background: selected ? "#fff0f0" : "#fff",
        border: `1.5px solid ${selected ? R : B}`,
        cursor: deleteMode ? "pointer" : "default",
        userSelect: "none",
      }}
    >
      {deleteMode && (
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggleSelect(file.id)}
          onClick={(e) => e.stopPropagation()}
          style={{
            cursor: "pointer",
            accentColor: R,
            width: 14,
            height: 14,
            flexShrink: 0,
          }}
        />
      )}
      <FileIcon />
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.72rem",
          color: B,
          flex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {file.name}
      </span>
    </div>
  );
}
