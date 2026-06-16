import type { Notebook } from "@freshr/shared";

const B = "#000000";
const W = "#FFFFFF";

export default function ArchivedSection({
  notebooks,
  onUnarchive,
}: {
  notebooks: Notebook[];
  onUnarchive: (id: string) => void;
}) {
  if (notebooks.length === 0) return null;

  return (
    <div style={{ marginTop: 40 }}>
      <div
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.14em",
          color: "#000000",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        ARCHIVED
        <span style={{ fontWeight: 400 }}>({notebooks.length})</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {notebooks.map((nb) => (
          <div
            key={nb.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 16px",
              background: W,
              border: `2px solid #ccc`,
              boxShadow: `2px 2px 0 #ccc`,
            }}
          >
            <span
              style={{
                flex: 1,
                fontFamily: "'Syne', sans-serif",
                fontWeight: 700,
                fontSize: "0.88rem",
                color: "#000000",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                minWidth: 0,
              }}
            >
              {nb.title}
            </span>
            <button
              onClick={() => onUnarchive(nb.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translate(-3px, -3px)";
                e.currentTarget.style.boxShadow = `4px 4px 0 ${B}`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "none";
                e.currentTarget.style.boxShadow = `2px 2px 0 ${B}`;
              }}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.06em",
                background: "none",
                border: `2px solid ${B}`,
                boxShadow: `2px 2px 0 ${B}`,
                padding: "4px 10px",
                cursor: "pointer",
                flexShrink: 0,
                color: B,
                transition: "transform 0.15s, box-shadow 0.15s",
              }}
            >
              Unarchive
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
