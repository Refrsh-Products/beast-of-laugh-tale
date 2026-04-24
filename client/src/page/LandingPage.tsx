import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import FeatureCard from "../components/landing/FeatureCard";
import TestimonialSection from "../components/landing/TestimonialSection";
import { FEATURES, STEPS, TICKER_TEXT } from "./dto/LandingPage.dto";

/* ─── Design tokens ───────────────────────────────────────── */
const G = "#84e487"; // green accent
const B = "#000000"; // black
const W = "#FFFFFF"; // white

/* ─── Main page ───────────────────────────────────────────── */
export default function LandingPage() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 80);
    return () => clearTimeout(t);
  }, []);

  const fadeIn = (delay = 0): React.CSSProperties => ({
    opacity: loaded ? 1 : 0,
    transform: loaded ? "none" : "translateY(24px)",
    transition: `opacity 0.7s ${delay}s, transform 0.7s ${delay}s`,
  });

  return (
    <div
      style={{
        fontFamily: "'IBM Plex Mono', monospace",
        background: W,
        color: B,
        overflowX: "hidden",
      }}
    >
      {/* ── NAV ── */}
      <nav
        id="nav"
        className="sticky top-0 z-50 flex items-center justify-between px-6 md:px-16 py-4 bg-white"
        style={{ borderBottom: `3px solid ${B}` }}
      >
        <span
          id="nav-logo"
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "1.5rem",
            letterSpacing: "-0.02em",
          }}
        >
          FRESHR
        </span>

        <div id="nav-actions" className="flex items-center gap-3">
          <span
            id="nav-cta"
            onClick={() => navigate("/signup")}
            style={{ cursor: "pointer" }}
          >
            <Button variant="green">Sign up</Button>
          </span>
          <span
            id="nav-log-in"
            onClick={() => navigate("/login")}
            style={{ cursor: "pointer" }}
          >
            <Button variant="default">Log in</Button>
          </span>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section
        id="hero"
        className="px-6 md:px-16 pt-16 pb-20"
        style={{ borderBottom: `3px solid ${B}` }}
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          {/* Copy */}
          <div style={fadeIn(0)}>
            <div
              id="hero-badge"
              style={{
                display: "inline-block",
                background: G,
                border: `2px solid ${B}`,
                boxShadow: `3px 3px 0 ${B}`,
                padding: "6px 14px",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                marginBottom: 28,
              }}
            >
              ◆ AI-powered learning platform
            </div>

            <h1
              id="hero-heading"
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2.8rem, 5.5vw, 5.5rem)",
                lineHeight: 1.0,
                letterSpacing: "-0.03em",
                marginBottom: 24,
              }}
            >
              Your notes.
              <br />
              Your AI.
              <br />
              <span
                style={{
                  background: G,
                  padding: "2px 10px",
                  border: `2px solid ${B}`,
                }}
              >
                Your edge.
              </span>
            </h1>

            <p
              id="hero-text"
              style={{
                fontSize: "0.85rem",
                lineHeight: 1.9,
                color: "#444",
                maxWidth: 460,
                marginBottom: 40,
              }}
            >
              Upload your study materials into notebooks. FRESHR indexes
              everything with AI — then lets you query your own knowledge base
              like a tutor who's read every page you have.
            </p>
          </div>

          {/* Product visual */}
          <div
            id="hero-card"
            style={{
              ...fadeIn(0.2),
              position: "relative",
              height: 440,
            }}
          >
            {/* Green offset shadow */}
            <div
              style={{
                position: "absolute",
                top: 18,
                left: 18,
                right: -16,
                bottom: -16,
                background: G,
                border: `2px solid ${B}`,
              }}
            />

            {/* Main card */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 2,
                bottom: 2,
                background: W,
                border: `3px solid ${B}`,
                boxShadow: `6px 6px 0 ${B}`,
                padding: 24,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {/* Notebook header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 14,
                }}
              >
                <span
                  style={{
                    background: G,
                    border: `1px solid ${B}`,
                    padding: "4px 10px",
                    fontSize: "0.62rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                  }}
                >
                  NOTEBOOK_01
                </span>
                <span style={{ fontSize: "0.62rem", color: "#999" }}>
                  3 docs · indexed ✓
                </span>
              </div>
              <div style={{ borderTop: `1px solid ${B}`, marginBottom: 14 }} />

              {/* User question */}
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    color: "#999",
                    marginBottom: 5,
                    letterSpacing: "0.12em",
                  }}
                >
                  YOU
                </div>
                <div
                  style={{
                    border: `2px solid ${B}`,
                    padding: "10px 12px",
                    fontSize: "0.73rem",
                    background: "#f5f5f5",
                    lineHeight: 1.65,
                  }}
                >
                  What's the difference between supervised and unsupervised
                  learning?
                </div>
              </div>

              {/* AI answer */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "0.58rem",
                    fontWeight: 700,
                    marginBottom: 5,
                    letterSpacing: "0.12em",
                  }}
                >
                  FRESHR <span style={{ color: G }}>AI ◆</span>
                </div>
                <div
                  style={{
                    border: `2px solid ${B}`,
                    padding: "10px 12px",
                    fontSize: "0.73rem",
                    lineHeight: 1.65,
                  }}
                >
                  From your notes in <strong>lecture_03.pdf</strong>: Supervised
                  learning trains on labeled data, while unsupervised finds
                  hidden patterns without labels...
                  <span
                    style={{
                      display: "inline-block",
                      width: 8,
                      height: 14,
                      background: G,
                      border: `1px solid ${B}`,
                      marginLeft: 4,
                      verticalAlign: "middle",
                      animation: "blink 1s step-end infinite",
                    }}
                  />
                </div>
              </div>

              {/* Source tags */}
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <span
                  style={{
                    background: G,
                    border: `1px solid ${B}`,
                    padding: "3px 10px",
                    fontSize: "0.6rem",
                    fontWeight: 700,
                  }}
                >
                  lecture_03.pdf
                </span>
                <span
                  style={{
                    border: `1px solid ${B}`,
                    padding: "3px 10px",
                    fontSize: "0.6rem",
                  }}
                >
                  + 2 sources
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── TICKER ── */}
      <div
        id="ticker"
        style={{
          background: B,
          borderBottom: `3px solid ${B}`,
          overflow: "hidden",
          padding: "12px 0",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            whiteSpace: "nowrap",
            animation: "ticker 26s linear infinite",
          }}
        >
          {[0, 1].map((i) => (
            <span
              key={i}
              style={{
                color: W,
                fontSize: "0.9rem",
                fontWeight: 700,
                letterSpacing: "0.12em",
              }}
            >
              {TICKER_TEXT}
            </span>
          ))}
        </div>
      </div>

      {/* ── STATS ── */}
      <section
        id="stats"
        className="py-12 px-6 md:px-16"
        style={{ background: B, borderBottom: `3px solid ${B}` }}
      >
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {(
            [
              ["10×", "Faster recall"],
              ["∞", "Documents"],
              ["RAG", "Powered"],
              ["100%", "Your data"],
            ] as [string, string][]
          ).map(([n, l]) => (
            <div key={l}>
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: "3.5rem",
                  color: G,
                  lineHeight: 1,
                }}
              >
                {n}
              </div>
              <div
                style={{
                  color: W,
                  fontSize: "0.82rem",
                  letterSpacing: "0.15em",
                  marginTop: 10,
                }}
              >
                {l}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section
        id="features"
        className="py-20 px-6 md:px-16"
        style={{ borderBottom: `3px solid ${B}` }}
      >
        <div className="max-w-7xl mx-auto">
          <div style={{ marginBottom: 52 }}>
            <div
              id="features-badge"
              style={{
                display: "inline-block",
                background: G,
                border: `2px solid ${B}`,
                boxShadow: `3px 3px 0 ${B}`,
                padding: "6px 14px",
                fontSize: "0.65rem",
                fontWeight: 700,
                letterSpacing: "0.15em",
                marginBottom: 18,
              }}
            >
              Features
            </div>
            <h2
              id="features-heading"
              style={{
                fontFamily: "'Syne', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2rem, 4vw, 3.5rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.02em",
              }}
            >
              Everything your
              <br />
              notes deserve.
            </h2>
          </div>

          <div
            id="features-grid"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {FEATURES.map((f, i) => (
              <FeatureCard key={i} {...f} />
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section
        id="how-it-works"
        className="py-20 px-6 md:px-16"
        style={{ background: G, borderBottom: `3px solid ${B}` }}
      >
        <div className="max-w-7xl mx-auto">
          <h2
            id="how-it-works-heading"
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              marginBottom: 52,
            }}
          >
            Three steps.
            <br />
            Zero complexity.
          </h2>

          <div
            id="how-it-works-grid"
            className="grid grid-cols-1 md:grid-cols-3 gap-5"
          >
            {STEPS.map((s) => (
              <div
                key={s.n}
                style={{
                  background: W,
                  border: `3px solid ${B}`,
                  boxShadow: `6px 6px 0 ${B}`,
                  padding: "36px 28px",
                }}
              >
                <div
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 800,
                    fontSize: "5rem",
                    lineHeight: 1,
                    color: B,
                    opacity: 1,
                    marginBottom: 2,
                  }}
                >
                  {s.n}
                </div>
                <h3
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.85rem",
                    letterSpacing: "0.1em",
                    marginBottom: 12,
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    fontSize: "0.78rem",
                    lineHeight: 1.85,
                    color: "#555",
                    margin: 0,
                  }}
                >
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <TestimonialSection />

      {/* ── CTA ── */}
      <section
        id="cta"
        className="py-24 px-6 md:px-16"
        style={{ background: B }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <h2
            id="cta-heading"
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              color: W,
              lineHeight: 1.0,
              letterSpacing: "-0.03em",
              marginBottom: 24,
            }}
          >
            Your notes are
            <br />
            <span style={{ color: G }}>waiting to teach you.</span>
          </h2>
          <p
            id="cta-text"
            style={{
              color: "#666",
              fontSize: "0.85rem",
              lineHeight: 1.85,
              maxWidth: 440,
              margin: "0 auto 48px",
            }}
          >
            Stop rereading the same pages. Start asking questions. FRESHR turns
            passive notes into an active learning engine.
          </p>
          <span
            id="cta-button"
            onClick={() => navigate("/signup")}
            style={{ cursor: "pointer" }}
          >
            <Button variant="green" large>
              Create your first notebook →
            </Button>
          </span>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer
        id="footer"
        className="px-6 md:px-16 py-7 flex flex-wrap items-center justify-between gap-4"
        style={{ borderTop: `3px solid ${B}` }}
      >
        <span
          id="footer-logo"
          style={{
            fontFamily: "'Syne', sans-serif",
            fontWeight: 800,
            fontSize: "1.25rem",
          }}
        >
          FRESHR
        </span>

        <div
          id="footer-links"
          className="flex gap-7"
          style={{ fontSize: "0.7rem" }}
        >
          {["Privacy", "Terms", "Contact"].map((l) => (
            <a
              key={l}
              href="#"
              style={{ color: "#888", textDecoration: "none" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = B;
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "#888";
                e.currentTarget.style.textDecoration = "none";
              }}
            >
              {l}
            </a>
          ))}
        </div>

        <span
          id="footer-copyright"
          style={{ fontSize: "0.7rem", color: "#888" }}
        >
          © 2025 FRESHR
        </span>
      </footer>
    </div>
  );
}
