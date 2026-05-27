import { useMediaQuery } from "../../hooks/useMediaQuery";
import { BP_PHONE } from "../../constants/breakpoints";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

export default function DashboardHeader({
  notebookCount,
  searchQuery,
  view,
  onSearchChange,
  onViewChange,
}: {
  notebookCount: number;
  searchQuery: string;
  view: "grid" | "list";
  onSearchChange: (val: string) => void;
  onViewChange: (view: "grid" | "list") => void;
}) {
  const isPhone = useMediaQuery(BP_PHONE);

  return (
    <div
      style={{
        padding: isPhone ? "16px" : "24px 32px 16px",
        borderBottom: `2px solid ${B}`,
        display: "flex",
        flexDirection: isPhone ? "column" : "row",
        alignItems: isPhone ? "stretch" : "center",
        justifyContent: "space-between",
        gap: isPhone ? 12 : 0,
        flexShrink: 0,
        background: W,
      }}
    >
      <div>
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "1.6rem",
            letterSpacing: "-0.02em",
            margin: 0,
            lineHeight: 1.1,
          }}
        >
          My Notebooks
        </h1>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.75rem",
            color: "#000000",
            margin: "4px 0 0",
          }}
        >
          {notebookCount} notebooks
        </p>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        {/* Search */}
        <div style={{ position: "relative", flex: isPhone ? 1 : "none", minWidth: 0 }}>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search notebooks..."
            onMouseEnter={(e) => {
              if (document.activeElement !== e.currentTarget)
                e.currentTarget.style.borderColor = G;
            }}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = B)}
            onFocus={(e) => (e.currentTarget.style.borderColor = B)}
            style={{
              border: `2px solid ${B}`,
              borderRadius: 0,
              padding: "8px 12px 8px 32px",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.75rem",
              background: W,
              outline: "none",
              width: isPhone ? "100%" : 200,
              transition: "border-color 0.15s",
              boxSizing: "border-box",
            }}
          />
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            style={{
              position: "absolute",
              left: 10,
              top: "50%",
              transform: "translateY(-50%)",
              pointerEvents: "none",
            }}
          >
            <circle cx="6" cy="6" r="4.5" stroke="#aaa" strokeWidth="1.5" />
            <path
              d="M10 10l2.5 2.5"
              stroke="#aaa"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>

        {/* Grid/List toggle */}
        <div style={{ display: "flex", border: `2px solid ${B}`, flexShrink: 0 }}>
          <button
            onClick={() => onViewChange("grid")}
            onMouseEnter={(e) => {
              if (view !== "grid") e.currentTarget.style.background = "#eee";
            }}
            onMouseLeave={(e) => {
              if (view !== "grid") e.currentTarget.style.background = W;
            }}
            style={{
              background: view === "grid" ? B : W,
              color: view === "grid" ? W : B,
              border: "none",
              padding: "8px 10px",
              cursor: "pointer",
              lineHeight: 1,
              transition: "background 0.12s",
            }}
            title="Grid view"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="0" y="0" width="6" height="6" />
              <rect x="8" y="0" width="6" height="6" />
              <rect x="0" y="8" width="6" height="6" />
              <rect x="8" y="8" width="6" height="6" />
            </svg>
          </button>
          <button
            onClick={() => onViewChange("list")}
            onMouseEnter={(e) => {
              if (view !== "list") e.currentTarget.style.background = "#eee";
            }}
            onMouseLeave={(e) => {
              if (view !== "list") e.currentTarget.style.background = W;
            }}
            style={{
              background: view === "list" ? B : W,
              color: view === "list" ? W : B,
              border: "none",
              borderLeft: `1px solid ${B}`,
              padding: "8px 10px",
              cursor: "pointer",
              lineHeight: 1,
              transition: "background 0.12s",
            }}
            title="List view"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
              <rect x="0" y="0" width="14" height="2.5" />
              <rect x="0" y="5.75" width="14" height="2.5" />
              <rect x="0" y="11.5" width="14" height="2.5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
