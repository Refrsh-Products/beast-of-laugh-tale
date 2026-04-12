const B = "#000000";
const W = "#FFFFFF";

interface SelectOption {
  value: string;
  label: string;
}

export default function QuizSelectDropdown({
  value,
  onChange,
  placeholder,
  options,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: SelectOption[];
}) {
  return (
    <div style={{ position: "relative" }}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{
          width: "100%",
          appearance: "none",
          border: `2px solid ${B}`,
          borderRadius: 0,
          background: W,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.72rem",
          fontWeight: 600,
          color: value ? B : "#999",
          padding: "9px 32px 9px 12px",
          cursor: "pointer",
          outline: "none",
          boxShadow: `3px 3px 0 ${B}`,
          boxSizing: "border-box",
        }}
      >
        <option value="" disabled hidden>
          {placeholder}
        </option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value} style={{ color: B }}>
            {opt.label}
          </option>
        ))}
      </select>
      <span
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
          fontSize: "0.6rem",
          color: B,
        }}
      >
        ▾
      </span>
    </div>
  );
}
