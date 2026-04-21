import { useState } from "react";
import { useNavigate } from "react-router-dom";

const B = "#000000";
const W = "#FFFFFF";
const G = "#84e487";

interface DevPage {
  title: string;
  description: string;
  path: string;
  tag: "sandbox" | "preview";
}

const pages: DevPage[] = [
  {
    title: "Component Sandbox",
    description:
      "Every UI component in the app — buttons, inputs, modals, cards. Review and give feedback here before anything ships.",
    path: "/dev/sandbox",
    tag: "sandbox",
  },
  {
    title: "Dashboard — Top Navbar",
    description:
      "Dashboard redesign preview: collapsible left sidebar replaced with a fixed top navbar.",
    path: "/dev/dashboard-top-nav",
    tag: "preview",
  },
];

export default function DevHubPage() {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f0",
        padding: "60px 48px",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      <div style={{ marginBottom: 48 }}>
        <div
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.18em",
            color: "#888",
            textTransform: "uppercase",
            marginBottom: 10,
          }}
        >
          Internal — not visible to users
        </div>
        <h1
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "2rem",
            margin: "0 0 10px",
            letterSpacing: "-0.02em",
          }}
        >
          Developer Hub
        </h1>
        <p style={{ fontSize: "0.75rem", color: "#555", margin: 0, lineHeight: 1.6 }}>
          Sandboxes, previews, and experiments. Add a new entry to the{" "}
          <code style={{ fontSize: "0.72rem", background: "#e8e8e4", padding: "1px 5px" }}>
            pages
          </code>{" "}
          array in <code style={{ fontSize: "0.72rem", background: "#e8e8e4", padding: "1px 5px" }}>DevHubPage.tsx</code> to register a new page here.
        </p>
      </div>

      <div style={{ height: 2, background: B, marginBottom: 40 }} />

      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 640 }}>
        {pages.map((page) => (
          <DevPageCard key={page.path} page={page} onClick={() => navigate(page.path)} />
        ))}
      </div>
    </div>
  );
}

function DevPageCard({ page, onClick }: { page: DevPage; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        padding: "20px 24px",
        background: W,
        border: `2px solid ${B}`,
        boxShadow: hovered ? `6px 6px 0 ${B}` : `3px 3px 0 ${B}`,
        transform: hovered ? "translate(-2px, -2px)" : "none",
        transition: "transform 0.12s, box-shadow 0.12s",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 16,
      }}
    >
      <div style={{ minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "1rem",
            }}
          >
            {page.title}
          </span>
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.58rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background: page.tag === "sandbox" ? B : G,
              color: page.tag === "sandbox" ? W : B,
              padding: "2px 7px",
              flexShrink: 0,
            }}
          >
            {page.tag}
          </span>
        </div>
        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.7rem",
            color: "#555",
            margin: 0,
            lineHeight: 1.5,
          }}
        >
          {page.description}
        </p>
      </div>
      <svg
        width="16"
        height="16"
        viewBox="0 0 16 16"
        fill="none"
        style={{ flexShrink: 0, opacity: hovered ? 1 : 0.25, transition: "opacity 0.12s" }}
      >
        <path
          d="M3 8h10M9 4l4 4-4 4"
          stroke={B}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}
