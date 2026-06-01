import { useState } from "react";
import { Link } from "react-router-dom";
import type { ProfileTab } from "./ProfileSidebar";
import Button from "../ui/Button";
import { sendSupportEmail } from "../../lib/supportEmail";
import { POLICY_LINKS } from "../../constants/policies";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

const SUPPORT_EMAIL = "team@freshr.cc";

const BUSINESS_ADDRESS_LINES = [
  "Ground floor, Setara’s Dream, 1/11 Pallabi Mirpur",
];
const BUSINESS_PHONE = "+8801813884557 +8801873070777";
const BUSINESS_HOURS = "Sun–Thu, 10:00–18:00 (GMT+6)";

interface SupportContentAreaProps {
  activeTab: ProfileTab;
  defaultName?: string;
  defaultEmail?: string;
}

export default function SupportContentArea({
  activeTab,
  defaultName = "",
  defaultEmail = "",
}: SupportContentAreaProps) {
  const [fullName, setFullName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (activeTab !== "support") return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (
      !fullName.trim() ||
      !email.trim() ||
      !mobile.trim() ||
      !message.trim()
    ) {
      setError("Please fill in every field.");
      return;
    }
    setError("");
    setIsSending(true);
    try {
      await sendSupportEmail({ fullName, email, mobile, message });
      setSent(true);
      setMobile("");
      setMessage("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not send your message. Please try again.",
      );
    } finally {
      setIsSending(false);
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: `3px solid ${B}`,
    borderRadius: 0,
    padding: "12px 14px",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "0.82rem",
    background: W,
    outline: "none",
    boxSizing: "border-box",
    transition: "border-color 0.15s",
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.12em",
    marginBottom: 6,
  };

  return (
    <div>
      <h1
        style={{
          fontFamily: "'Syne', sans-serif",
          fontWeight: 800,
          fontSize: "2rem",
          letterSpacing: "-0.02em",
          marginBottom: 8,
          lineHeight: 1.1,
        }}
      >
        Support
      </h1>
      <p
        style={{
          fontSize: "0.82rem",
          lineHeight: 1.7,
          color: "#000000",
          marginBottom: 28,
        }}
      >
        Send us a message and our team will get back to you.
      </p>

      {/* ── CONTACT CARDS ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 14,
          marginBottom: 28,
        }}
      >
        <ContactCard label="EMAIL" accent>
          <span
            style={{
              fontWeight: 800,
              fontSize: "0.95rem",
              color: B,
              textUnderlineOffset: 3,
              wordBreak: "break-all",
            }}
          >
            {SUPPORT_EMAIL}
          </span>
        </ContactCard>

        <ContactCard label="PHONE">
          <span
            style={{
              fontWeight: 800,
              fontSize: "0.95rem",
              color: B,
              textUnderlineOffset: 3,
            }}
          >
            {BUSINESS_PHONE}
          </span>
        </ContactCard>

        <ContactCard label="BUSINESS HOURS">
          <p
            style={{
              fontSize: "0.82rem",
              lineHeight: 1.6,
              margin: 0,
              fontWeight: 600,
            }}
          >
            {BUSINESS_HOURS}
          </p>
        </ContactCard>

        <ContactCard label="ADDRESS">
          <address
            style={{
              fontStyle: "normal",
              fontSize: "0.78rem",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {BUSINESS_ADDRESS_LINES.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </address>
        </ContactCard>
      </div>

      {/* ── FORM ── */}
      <div
        style={{
          background: W,
          border: `3px solid ${B}`,
          boxShadow: `6px 6px 0 ${G}`,
          padding: "28px 24px",
        }}
      >
        <h2
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "1.2rem",
            letterSpacing: "-0.02em",
            marginBottom: 20,
          }}
        >
          Send us a message
        </h2>

        {error && (
          <p
            style={{
              color: "#cc0000",
              fontSize: "0.75rem",
              marginBottom: 16,
            }}
          >
            {error}
          </p>
        )}

        {sent && (
          <div
            style={{
              border: `2px solid ${B}`,
              background: G,
              padding: "12px 14px",
              marginBottom: 16,
              fontSize: "0.78rem",
              fontWeight: 700,
              letterSpacing: "0.04em",
            }}
          >
            Message sent. We'll get back to you soon.
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: 14 }}
        >
          <div>
            <label style={labelStyle}>FULL NAME</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Jane Doe"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>MOBILE NUMBER</label>
            <input
              type="tel"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              placeholder="+880 1XXX-XXXXXX"
              style={inputStyle}
            />
          </div>

          <div>
            <label style={labelStyle}>MESSAGE</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us how we can help..."
              rows={5}
              style={{ ...inputStyle, resize: "vertical" }}
            />
          </div>

          <div style={{ marginTop: 6 }}>
            <Button
              variant="green"
              fullWidth
              type="submit"
              disabled={isSending}
            >
              {isSending ? "Sending..." : "Send message →"}
            </Button>
          </div>

          <p
            style={{
              fontSize: "0.7rem",
              color: "#555",
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            Your message will be sent directly to {SUPPORT_EMAIL}.
          </p>
        </form>
      </div>

      {/* ── LEGAL ── */}
      <div style={{ marginTop: 28 }}>
        <div
          style={{
            fontSize: "0.68rem",
            fontWeight: 700,
            letterSpacing: "0.14em",
            marginBottom: 10,
          }}
        >
          LEGAL
        </div>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 18,
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: "0.78rem",
          }}
        >
          {(["privacy", "terms", "refund"] as const).map((key) => (
            <Link
              key={key}
              to={POLICY_LINKS[key].path}
              style={{
                color: B,
                fontWeight: 700,
                textDecoration: "underline",
                textUnderlineOffset: 3,
              }}
            >
              {POLICY_LINKS[key].label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function ContactCard({
  label,
  accent = false,
  children,
}: {
  label: string;
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: accent ? G : W,
        border: `2px solid ${B}`,
        boxShadow: `4px 4px 0 ${B}`,
        padding: "16px 18px",
      }}
    >
      <div
        style={{
          fontSize: "0.68rem",
          fontWeight: 700,
          letterSpacing: "0.14em",
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}
