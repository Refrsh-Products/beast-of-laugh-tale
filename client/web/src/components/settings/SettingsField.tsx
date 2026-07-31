import Button from "../ui/LegacyButton";

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
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.14em",
          color: B,
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
            onMouseEnter={(e) => {
              if (document.activeElement !== e.currentTarget)
                e.currentTarget.style.borderColor = G;
            }}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = B)}
            onFocus={(e) => (e.currentTarget.style.borderColor = B)}
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
              transition: "border-color 0.15s",
            }}
          />
          <Button variant="green" onClick={onSave}>Save</Button>
          <Button variant="default" onClick={onCancel}>Cancel</Button>
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
              color: B,
              wordBreak: "break-all",
            }}
          >
            {value || <span style={{ color: "#000000" }}>—</span>}
          </span>
          {!disabled && (
            <button
              onClick={onEditStart}
              onMouseEnter={(e) => (e.currentTarget.style.color = B)}
              onMouseLeave={(e) => (e.currentTarget.style.color = B)}
              style={{
                background: "none",
                border: "none",
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "#000000",
                cursor: "pointer",
                padding: "4px 0",
                whiteSpace: "nowrap",
                textDecoration: "underline",
                textUnderlineOffset: 3,
                flexShrink: 0,
                transition: "color 0.12s",
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
            fontSize: "0.75rem",
            color: "#000000",
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
