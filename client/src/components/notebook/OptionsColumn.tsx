const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

export type ActiveView = "chat" | "quiz" | "presentation";

interface OptionsColumnProps {
  activeView: ActiveView;
  onViewChange: (view: ActiveView) => void;
}

interface NavItem {
  id: ActiveView;
  label: string;
  sublabel: string;
  icon: React.ReactNode;
}

function ChatIcon({ active }: { active: boolean }) {
  const color = active ? W : B;
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path
        d="M3 3h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6l-3 3V4a1 1 0 0 1 1-1z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PresentationIcon({ active }: { active: boolean }) {
  const color = active ? W : B;
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect x="2" y="2" width="14" height="11" rx="1" stroke={color} strokeWidth="1.6" />
      <path d="M9 13v3M6 16h6" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M5 6h8M5 9h5" stroke={color} strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function QuizIcon({ active }: { active: boolean }) {
  const color = active ? W : B;
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <rect
        x="2"
        y="2"
        width="14"
        height="14"
        rx="1"
        stroke={color}
        strokeWidth="1.6"
      />
      <path
        d="M5 6h8M5 9h5M5 12h6"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default function OptionsColumn({
  activeView,
  onViewChange,
}: OptionsColumnProps) {
  const navItems: NavItem[] = [
    {
      id: "chat",
      label: "Chat",
      sublabel: "Ask questions about your notes",
      icon: <ChatIcon active={activeView === "chat"} />,
    },
    {
      id: "quiz",
      label: "Quiz Generator",
      sublabel: "Test your knowledge",
      icon: <QuizIcon active={activeView === "quiz"} />,
    },
    {
      id: "presentation",
      label: "Presentation",
      sublabel: "Generate slide decks",
      icon: <PresentationIcon active={activeView === "presentation"} />,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "#f7f7f5",
        borderRight: `2px solid ${B}`,
        overflow: "hidden",
      }}
    >
      {/* Column header */}
      <div
        style={{
          height: 44,
          padding: "0 14px",
          borderBottom: `2px solid ${B}`,
          display: "flex",
          alignItems: "center",
          flexShrink: 0,
          background: "#f7f7f5",
        }}
      >
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            color: "#555",
          }}
        >
          TOOLS
        </span>
      </div>

      {/* Nav items */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          padding: "14px 10px",
          gap: 4,
        }}
      >
        {navItems.map((item) => {
          const isActive = activeView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              style={{
                display: "flex",
                alignItems: "flex-start",
                gap: 10,
                padding: "12px 12px",
                background: isActive ? B : "transparent",
                color: isActive ? W : B,
                border: `2px solid ${isActive ? B : "transparent"}`,
                boxShadow: isActive ? `3px 3px 0 ${G}` : "none",
                cursor: "pointer",
                textAlign: "left",
                width: "100%",
                transition: "background 0.12s, border-color 0.12s",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#eeeee8";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "#ccc";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                  (e.currentTarget as HTMLButtonElement).style.borderColor =
                    "transparent";
                }
              }}
            >
              <span style={{ marginTop: 1, flexShrink: 0 }}>{item.icon}</span>
              <div>
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    margin: "0 0 3px",
                    letterSpacing: "0.02em",
                    color: isActive ? W : B,
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: "0.62rem",
                    margin: 0,
                    lineHeight: 1.5,
                    color: isActive ? "rgba(255,255,255,0.65)" : "#888",
                  }}
                >
                  {item.sublabel}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
