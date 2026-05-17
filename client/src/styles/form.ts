import type React from "react";
import { BLACK, GREEN } from "../constants/theme";

export const inputStyle: React.CSSProperties = {
  width: "100%",
  border: `3px solid ${BLACK}`,
  borderRadius: 0,
  padding: "12px 14px",
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: "0.82rem",
  background: "#FFFFFF",
  outline: "none",
  boxSizing: "border-box",
  transition: "border-color 0.15s",
};

export const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'IBM Plex Mono', monospace",
  fontSize: "0.68rem",
  fontWeight: 700,
  letterSpacing: "0.12em",
  marginBottom: 6,
};

export const inputHandlers = {
  onMouseEnter: (e: React.MouseEvent<HTMLInputElement>) => {
    if (document.activeElement !== e.currentTarget)
      e.currentTarget.style.borderColor = GREEN;
  },
  onMouseLeave: (e: React.MouseEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = BLACK;
  },
  onFocus: (e: React.FocusEvent<HTMLInputElement>) => {
    e.currentTarget.style.borderColor = BLACK;
  },
};
