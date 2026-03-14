const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

interface SettingsFieldProps {
  label: string;
  value: string;
  isEditing?: boolean;
  disabled?: boolean;
  onChange?: (val: string) => void;
  onEditStart?: () => void;
  onSave?: () => void;
  onCancel?: () => void;
}

export default function SettingsField({
  label,
  value,
  isEditing = false,
  disabled = false,
  onChange,
  onEditStart,
  onSave,
  onCancel,
}: SettingsFieldProps) {
  return (
    <div style={{ borderBottom: `2px solid ${B}`, paddingBottom: 20 }}>
      <label
        style={{
          display: "block",
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.65rem",
          fontWeight: 700,
          letterSpacing: "0.14em",
          color: disabled ? "#aaa" : "#555",
          marginBottom: 8,
        }}
      >
        {label}
      </label>

      {isEditing ? (
        /* Edit mode */
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <input
            autoFocus
            type="text"
            value={value}
            onChange={(e) => onChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSave?.();
              if (e.key === "Escape") onCancel?.();
            }}
            style={{
              flex: 1,
              border: `3px solid ${B}`,
              borderRadius: 0,
              padding: "10px 12px",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.88rem",
              background: W,
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <button
            onClick={onSave}
            style={{
              background: G,
              color: B,
              border: `2px solid ${B}`,
              boxShadow: `3px 3px 0 ${B}`,
              padding: "10px 16px",
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 700,
              fontSize: "0.7rem",
              letterSpacing: "0.06em",
              cursor: "pointer",
              whiteSpace: "nowrap",
              lineHeight: 1,
            }}
          >
            Save
          </button>
          <button
            onClick={onCancel}
            style={{
              background: W,
              color: B,
              border: `2px solid ${B}`,
              padding: "10px 16px",
              fontFamily: "'IBM Plex Mono', monospace",
              fontWeight: 700,
              fontSize: "0.7rem",
              letterSpacing: "0.06em",
              cursor: "pointer",
              whiteSpace: "nowrap",
              lineHeight: 1,
            }}
          >
            Cancel
          </button>
        </div>
      ) : (
        /* View mode */
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
          }}
        >
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "0.88rem",
              color: disabled ? "#aaa" : B,
              wordBreak: "break-all",
            }}
          >
            {value || <span style={{ color: "#aaa" }}>—</span>}
          </span>
          {!disabled && (
            <button
              onClick={onEditStart}
              style={{
                background: "none",
                border: "none",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.7rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "#888",
                cursor: "pointer",
                padding: "4px 0",
                whiteSpace: "nowrap",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                flexShrink: 0,
              }}
            >
              Edit
            </button>
          )}
        </div>
      )}

      {disabled && (
        <p
          style={{
            fontSize: "0.63rem",
            color: "#aaa",
            marginTop: 6,
            fontFamily: "'IBM Plex Mono', monospace",
          }}
        >
          Email cannot be changed
        </p>
      )}
    </div>
  );
}
