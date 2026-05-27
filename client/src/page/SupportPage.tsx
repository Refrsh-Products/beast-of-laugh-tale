import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import { sendSupportEmail } from "../lib/supportEmail";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

const SUPPORT_EMAIL = "team@freshr.cc";
// TODO: replace with real values
const BUSINESS_ADDRESS_LINES = [
  "Ground floor, Setara’s Dream, 1/11 Pallabi Mirpur",
];
const BUSINESS_PHONE = "+8801813884557 +8801873070777";
const BUSINESS_HOURS = "Sun–Thu, 10:00–18:00 (GMT+6)";

export default function SupportPage() {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sent, setSent] = useState(false);

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
    <div
      style={{
        minHeight: "100dvh",
        background: W,
        fontFamily: "'IBM Plex Mono', monospace",
        color: B,
      }}
    >
      {/* ── NAV ── */}
      <nav
        className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-16 py-4 bg-white"
        style={{ borderBottom: `3px solid ${B}` }}
      >
        <span
          onClick={() => navigate("/")}
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "1.5rem",
            letterSpacing: "-0.02em",
            cursor: "pointer",
          }}
        >
          FRESHR
        </span>
        <span onClick={() => navigate("/")} style={{ cursor: "pointer" }}>
          <Button variant="default">← Home</Button>
        </span>
      </nav>

      {/* ── CONTENT ── */}
      <div className="px-6 md:px-16 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div style={{ marginBottom: 40 }}>
            <div
              style={{
                display: "inline-block",
                background: B,
                color: W,
                border: `2px solid ${B}`,
                padding: "6px 14px",
                fontSize: "0.75rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                marginBottom: 18,
              }}
            >
              ◆ SUPPORT
            </div>
            <h1
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2.5rem, 5vw, 4.5rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.03em",
                marginBottom: 16,
              }}
            >
              How can we
              <br />
              <span
                style={{
                  background: G,
                  padding: "2px 10px",
                  border: `2px solid ${B}`,
                  display: "inline-block",
                  marginTop: 8,
                }}
              >
                help?
              </span>
            </h1>
            <p
              style={{
                fontSize: "0.85rem",
                lineHeight: 1.9,
                maxWidth: 560,
              }}
            >
              Drop us a message and our team will get back to you. You can also
              reach us directly using the details on the right.
            </p>
          </div>

          <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-10"
            style={{ alignItems: "start" }}
          >
            {/* ── FORM ── */}
            <div
              style={{
                background: W,
                border: `3px solid ${B}`,
                boxShadow: `8px 8px 0 ${G}`,
                padding: "36px 32px",
              }}
            >
              <h2
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: "1.5rem",
                  letterSpacing: "-0.02em",
                  marginBottom: 24,
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
                style={{ display: "flex", flexDirection: "column", gap: 16 }}
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
                    rows={6}
                    style={{ ...inputStyle, resize: "vertical" }}
                  />
                </div>

                <div style={{ marginTop: 8 }}>
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

            {/* ── CONTACT INFO ── */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <ContactCard label="EMAIL" accent>
                <span
                  style={{
                    fontWeight: 800,
                    fontSize: "1.4rem",
                    color: B,

                    textUnderlineOffset: 4,
                    wordBreak: "break-all",
                  }}
                >
                  {SUPPORT_EMAIL}
                </span>
              </ContactCard>

              <ContactCard label="PHONE">
                <span
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: "1.2rem",
                    color: B,
                    textUnderlineOffset: 4,
                  }}
                >
                  {BUSINESS_PHONE}
                </span>
              </ContactCard>

              <ContactCard label="BUSINESS HOURS">
                <p
                  style={{
                    fontSize: "0.95rem",
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
                    fontSize: "0.9rem",
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {BUSINESS_ADDRESS_LINES.map((line, i) => (
                    <div key={i}>{line}</div>
                  ))}
                </address>
              </ContactCard>
            </div>
          </div>
        </div>
      </div>

      {/* ── FOOTER ── */}
      <footer
        className="px-6 md:px-16 py-7 flex flex-wrap items-center justify-between gap-4"
        style={{ borderTop: `3px solid ${B}`, marginTop: 40 }}
      >
        <span
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "1.25rem",
          }}
        >
          FRESHR
        </span>
        <span style={{ fontSize: "0.75rem" }}>© 2026 FRESHR</span>
      </footer>
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
        border: `3px solid ${B}`,
        boxShadow: `6px 6px 0 ${B}`,
        padding: "22px 24px",
      }}
    >
      <div
        style={{
          fontSize: "0.7rem",
          fontWeight: 700,
          letterSpacing: "0.15em",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}
