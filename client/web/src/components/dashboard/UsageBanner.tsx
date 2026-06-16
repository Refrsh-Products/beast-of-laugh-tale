import type { AccountUseage } from "@freshr/shared";

const B = "#000000";
const TRACK = "#e8e8e4";
const FILL = "#000000";

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1_024).toFixed(0)} KB`;
}

function UsageBar({
  label,
  used,
  limit,
  formatValue = (n) => String(n),
}: {
  label: string;
  used: number;
  limit: number;
  formatValue?: (n: number) => string;
}) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 140 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.75rem",
          color: "#000000",
        }}
      >
        <span>{label}</span>
        <span>
          {formatValue(used)} / {formatValue(limit)}
        </span>
      </div>
      <div
        style={{
          height: 4,
          background: TRACK,
          border: `1px solid ${B}`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            height: "100%",
            width: `${pct}%`,
            background: FILL,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

export default function UsageBanner({ usage }: { usage: AccountUseage }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 24,
        padding: "12px 16px",
        border: `2px solid ${B}`,
        background: "#fff",
        marginBottom: 20,
        flexWrap: "wrap",
      }}
    >
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.75rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          whiteSpace: "nowrap",
        }}
      >
        {usage.plan}
      </span>

      <div style={{ width: 1, height: 28, background: B, flexShrink: 0 }} />

      <UsageBar
        label="Notebooks"
        used={usage.notebooks.used}
        limit={usage.notebooks.limit}
      />

      <UsageBar
        label="Storage"
        used={Number(usage.storage.used_bytes)}
        limit={Number(usage.storage.limit_bytes)}
        formatValue={formatBytes}
      />

      <UsageBar
        label="Daily Quizzes"
        used={usage.daily_quizzes.used}
        limit={usage.daily_quizzes.limit}
      />

      <UsageBar
        label="Presentations"
        used={usage.presentations.used}
        limit={usage.presentations.limit}
      />
    </div>
  );
}
