import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button";
import FeatureCard from "../components/landing/FeatureCard";
import TestimonialSection from "../components/landing/TestimonialSection";
import RotatingText from "../components/landing/RotatingText";
import PricingSection from "../components/landing/PricingSection";
import { FEATURES, STEPS, TICKER_TEXT } from "./dto/LandingPage.dto";

import { GREEN as G, BLACK as B, WHITE as W } from "../constants/theme";

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
        className="px-[4.5rem] md:px-48 pt-16 pb-20"
        style={{
          borderBottom: `3px solid ${B}`,
          minHeight: "calc(100vh - 65px - 44px)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-40 items-center w-full">
          {/* Copy */}
          <div style={fadeIn(0)}>
            <div
              id="hero-badge"
              style={{
                display: "inline-block",
                background: B,
                color: W,
                border: `2px solid ${B}`,
                padding: "6px 14px",
                fontSize: "0.75rem",
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
                fontSize: "clamp(4rem, 8vw, 8.5rem)",
                lineHeight: 1.0,
                letterSpacing: "-0.03em",
                marginBottom: 24,
              }}
            >
              Your
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
                <RotatingText words={["notes.", "AI.", "edge."]} />
              </span>
            </h1>

            <p
              id="hero-text"
              style={{
                fontSize: "0.85rem",
                lineHeight: 1.9,
                color: "#000000",
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
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                  }}
                >
                  NOTEBOOK_01
                </span>
                <span style={{ fontSize: "0.75rem", color: "#000000" }}>
                  3 docs · indexed ✓
                </span>
              </div>
              <div style={{ borderTop: `1px solid ${B}`, marginBottom: 14 }} />

              {/* User question */}
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#000000",
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
                    fontSize: "0.75rem",
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
                    fontSize: "0.75rem",
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
                    fontSize: "0.75rem",
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
                    fontSize: "0.75rem",
                    fontWeight: 700,
                  }}
                >
                  lecture_03.pdf
                </span>
                <span
                  style={{
                    border: `1px solid ${B}`,
                    padding: "3px 10px",
                    fontSize: "0.75rem",
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
              color: B,
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
                    color: "#000000",
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

      {/* ── PRICING ── */}
      <PricingSection />

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

        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <span
            id="footer-support"
            onClick={() => navigate("/support")}
            onMouseEnter={(e) =>
              (e.currentTarget.style.textDecoration = "underline")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.textDecoration = "none")
            }
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              letterSpacing: "0.1em",
              color: "#000000",
              cursor: "pointer",
              textUnderlineOffset: 3,
            }}
          >
            SUPPORT
          </span>

          <span
            id="footer-copyright"
            style={{ fontSize: "0.75rem", color: "#000000" }}
          >
            © 2026 FRESHR
          </span>
        </div>
      </footer>
    </div>
  );
}
