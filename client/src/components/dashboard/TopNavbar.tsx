import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

interface TopNavbarProps {
  userEmail: string;
  userName?: string;
  profilePictureUrl?: string;
}

export default function TopNavbar({
  userEmail,
  userName,
  profilePictureUrl,
}: TopNavbarProps) {
  const navigate = useNavigate();
  const displayLabel = userName?.trim() || userEmail;
  const avatarLetter = (userName || userEmail || "?")[0].toUpperCase();
  const [avatarError, setAvatarError] = useState(false);
  const [profileHovered, setProfileHovered] = useState(false);

  const hasAvatar =
    !!profilePictureUrl && profilePictureUrl.trim() !== "" && !avatarError;

  useEffect(() => {
    setAvatarError(false);
  }, [profilePictureUrl]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 64px",
        height: 56,
        background: W,
        color: B,
        flexShrink: 0,
        borderBottom: `3px solid ${B}`,
      }}
    >
      {/* Logo */}
      <div
        onClick={() => navigate("/dashboard")}
        style={{
          position: "relative",
          display: "inline-flex",
          cursor: "pointer",
          userSelect: "none",
        }}
      >
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "1.5rem",
            letterSpacing: "-0.02em",
            color: G,
          }}
        >
          FRESHR
        </span>
        <span
          style={{
            position: "absolute",
            top: -4,
            right: -36,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.5rem",
            fontWeight: 700,
            letterSpacing: "0.1em",
            background: B,
            color: G,
            padding: "2px 5px",
          }}
        >
          BETA
        </span>
      </div>

      {/* Profile */}
      <div
        onClick={() => navigate("/profile")}
        onMouseEnter={() => setProfileHovered(true)}
        onMouseLeave={() => setProfileHovered(false)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          userSelect: "none",
          padding: "5px 8px",
          background: profileHovered ? "#f0f0f0" : "transparent",
          transition: "background 0.12s",
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            background: hasAvatar ? "transparent" : G,
            color: B,
            borderRadius: 0,
            border: `2px solid ${B}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "0.65rem",
            flexShrink: 0,
            overflow: "hidden",
          }}
        >
          {hasAvatar ? (
            <img
              src={profilePictureUrl}
              alt={displayLabel}
              onError={() => setAvatarError(true)}
              style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            />
          ) : (
            avatarLetter
          )}
        </div>
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.68rem",
            color: "#555",
            maxWidth: 160,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {displayLabel}
        </span>
      </div>
    </div>
  );
}
