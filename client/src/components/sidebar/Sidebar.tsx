import { useState } from "react";
import { useNavigate } from "react-router-dom";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

interface SidebarProps {
  userEmail: string;
  userName?: string;
}

export default function Sidebar({ userEmail, userName }: SidebarProps) {
  const displayLabel = userName || userEmail;
  const avatarLetter = (userName || userEmail || "?")[0].toUpperCase();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [collapseHovered, setCollapseHovered] = useState(false);
  const [collapsePressed, setCollapsePressed] = useState(false);

  return (
    <div
      style={{
        width: collapsed ? 60 : 240,
        minWidth: collapsed ? 60 : 240,
        transition: "width 0.2s ease, min-width 0.2s ease",
        height: "100vh",
        position: "sticky",
        top: 0,
        background: B,
        color: W,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRight: `2px solid ${B}`,
        flexShrink: 0,
      }}
    >
      {/* ── Top section ── */}
      <div
        style={{
          padding: collapsed ? "20px 0" : "20px 16px",
          borderBottom: "1px solid #222",
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          gap: 8,
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <div
            onClick={() => navigate("/dashboard")}
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "1.25rem",
              letterSpacing: "-0.02em",
              color: G,
              cursor: "pointer",
              userSelect: "none",
            }}
          >
            FRESHR
          </div>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          onMouseEnter={() => setCollapseHovered(true)}
          onMouseLeave={() => {
            setCollapseHovered(false);
            setCollapsePressed(false);
          }}
          onMouseDown={() => setCollapsePressed(true)}
          onMouseUp={() => setCollapsePressed(false)}
          style={{
            background: collapsePressed
              ? "#333"
              : collapseHovered
                ? "#1a1a1a"
                : "none",
            border: `1px solid ${collapseHovered ? "#555" : "#333"}`,
            cursor: "pointer",
            padding: "4px 5px",
            lineHeight: 1,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: collapsePressed ? "scale(0.92)" : "scale(1)",
            transition: "background 0.12s, border-color 0.12s, transform 0.08s",
          }}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="none"
            style={{
              transform: collapsed ? "rotate(180deg)" : "rotate(0deg)",
              transition: "transform 0.2s ease",
            }}
          >
            <path
              d="M7.5 2L4 6l3.5 4"
              stroke={collapseHovered ? "#aaa" : "#666"}
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>

      {/* ── Middle section (notebooks) ── */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: collapsed ? "16px 0" : "16px",
        }}
      >
        {!collapsed && (
          <>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.6rem",
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "#555",
                marginBottom: 12,
              }}
            >
              NOTEBOOKS
            </div>
            <div
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.68rem",
                color: "#444",
                lineHeight: 1.5,
              }}
            >
              Open a notebook to see it here
            </div>
          </>
        )}
        {collapsed && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            {/* Folder icon placeholder */}
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M2 5a2 2 0 0 1 2-2h3.586a1 1 0 0 1 .707.293L9.707 4.707A1 1 0 0 0 10.414 5H16a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5Z"
                stroke="#444"
                strokeWidth="1.5"
                fill="none"
              />
            </svg>
          </div>
        )}
      </div>

      {/* ── Bottom section ── */}
      <div
        style={{
          borderTop: "1px solid #222",
          flexShrink: 0,
        }}
      >
        {/* Profile row — click to go to profile page */}
        <div
          onClick={() => navigate("/profile")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: collapsed ? "14px 0" : "14px 16px",
            justifyContent: collapsed ? "center" : "flex-start",
            cursor: "pointer",
            userSelect: "none",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLDivElement).style.background = "#111";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLDivElement).style.background =
              "transparent";
          }}
        >
          {/* Avatar */}
          <div
            style={{
              width: 28,
              height: 28,
              background: G,
              color: B,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "0.7rem",
              flexShrink: 0,
            }}
          >
            {avatarLetter}
          </div>

          {!collapsed && (
            <span
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.68rem",
                color: "#888",
                flex: 1,
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {displayLabel}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
