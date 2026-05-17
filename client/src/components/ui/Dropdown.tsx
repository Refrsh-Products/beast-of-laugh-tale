import { useState, useRef, useEffect } from "react";

const B = "#000000";
const W = "#FFFFFF";

interface SelectOption {
  value: string;
  label: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  options: SelectOption[];
  disabled?: boolean;
}

export default function Dropdown({
  value,
  onChange,
  placeholder,
  options,
  disabled = false,
}: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const selectedLabel = options.find((o) => o.value === value)?.label;

  return (
    <div ref={containerRef} style={{ position: "relative", userSelect: "none" }}>
      {/* Trigger */}
      <div
        onClick={() => !disabled && setOpen((o) => !o)}
        style={{
          width: "100%",
          border: `2px solid ${disabled ? "#ccc" : B}`,
          background: disabled ? "#f5f5f5" : W,
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: "0.75rem",
          fontWeight: 600,
          color: B,
          padding: "9px 32px 9px 12px",
          cursor: disabled ? "not-allowed" : "pointer",
          boxShadow: disabled ? "none" : `3px 3px 0 ${B}`,
          boxSizing: "border-box",
          position: "relative",
        }}
      >
        {selectedLabel ?? placeholder}
        <span
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: `translateY(-50%) rotate(${open ? "180deg" : "0deg"})`,
            fontSize: "0.75rem",
            color: B,
            transition: "transform 0.15s",
            pointerEvents: "none",
          }}
        >
          ▾
        </span>
      </div>

      {/* Options list */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "calc(100% + 2px)",
            left: 0,
            right: 0,
            border: `2px solid ${B}`,
            background: W,
            zIndex: 1000,
            boxShadow: `3px 3px 0 ${B}`,
          }}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            const isHovered = hovered === opt.value;
            return (
              <div
                key={opt.value}
                onMouseEnter={() => setHovered(opt.value)}
                onMouseLeave={() => setHovered(null)}
                onMouseDown={() => {
                  onChange(opt.value);
                  setOpen(false);
                  setHovered(null);
                }}
                style={{
                  padding: "9px 12px",
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "0.75rem",
                  fontWeight: isSelected ? 700 : 500,
                  color: isHovered ? W : B,
                  background: isHovered ? B : isSelected ? "#f0f0f0" : W,
                  cursor: "pointer",
                  borderBottom: "1px solid #e8e8e8",
                }}
              >
                {opt.label}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
