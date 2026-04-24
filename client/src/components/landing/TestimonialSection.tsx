import { useState } from "react";

const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

const CARDS_PER_PAGE = 3;

const PLACEHOLDERS = [
  { stars: 5 },
  { stars: 4 },
  { stars: 4 },
  { stars: 4 },
  { stars: 5 },
];

const LOREM =
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam.";

const TOTAL_PAGES = Math.ceil(PLACEHOLDERS.length / CARDS_PER_PAGE);

function Stars({ count }: { count: number }) {
  return (
    <div style={{ display: "flex", gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{
            fontSize: "1.35rem",
            color: i <= count ? G : "#ddd",
            WebkitTextStroke: i <= count ? `1px ${B}` : "1px #ccc",
          }}
        >
          ★
        </span>
      ))}
    </div>
  );
}

function ArrowBtn({
  children,
  onClick,
  disabled,
}: {
  children: string;
  onClick: () => void;
  disabled: boolean;
}) {
  const [hovered, setHovered] = useState(false);
  const [down, setDown] = useState(false);

  const transform = disabled
    ? "none"
    : down
      ? "translate(2px, 2px)"
      : hovered
        ? "translate(-3px, -3px)"
        : "none";

  const shadow = disabled
    ? "none"
    : down
      ? `2px 2px 0 ${B}`
      : hovered
        ? `6px 6px 0 ${B}`
        : `4px 4px 0 ${B}`;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        setDown(false);
      }}
      onMouseDown={() => !disabled && setDown(true)}
      onMouseUp={() => setDown(false)}
      style={{
        background: disabled ? "#f0f0f0" : hovered ? G : W,
        color: disabled ? "#bbb" : B,
        border: `2px solid ${disabled ? "#ddd" : B}`,
        boxShadow: shadow,
        transform,
        padding: "11px 22px",
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "0.85rem",
        fontWeight: 700,
        letterSpacing: "0.08em",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "transform 0.12s, box-shadow 0.12s, background 0.12s",
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}

export default function TestimonialSection() {
  const [page, setPage] = useState(0);
  const [visible, setVisible] = useState(true);

  const changePage = (newPage: number) => {
    setVisible(false);
    setTimeout(() => {
      setPage(newPage);
      setVisible(true);
    }, 200);
  };

  const prev = () => page > 0 && changePage(page - 1);
  const next = () => page < TOTAL_PAGES - 1 && changePage(page + 1);

  const currentCards = PLACEHOLDERS.slice(
    page * CARDS_PER_PAGE,
    page * CARDS_PER_PAGE + CARDS_PER_PAGE
  );

  return (
    <section
      className="py-20 px-6 md:px-16"
      style={{ background: "#f5f5f0", borderBottom: `3px solid ${B}` }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div style={{ marginBottom: 52 }}>
          <div
            style={{
              display: "inline-block",
              background: G,
              border: `2px solid ${B}`,
              padding: "6px 14px",
              fontSize: "0.65rem",
              fontWeight: 700,
              letterSpacing: "0.15em",
              marginBottom: 18,
            }}
          >
            Testimonials
          </div>
          <h2
            style={{
              fontFamily: "'Syne', sans-serif",
              fontWeight: 800,
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
            }}
          >
            What students
            <br />
            are saying.
          </h2>
        </div>

        {/* Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 20,
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 0.2s ease, transform 0.2s ease",
          }}
        >
          {currentCards.map((p, i) => (
            <div
              key={i}
              style={{
                border: `3px solid ${B}`,
                padding: "28px 24px",
                background: W,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {/* Name */}
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: "1rem",
                  letterSpacing: "-0.01em",
                }}
              >
                Full Name
              </div>

              {/* University */}
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "#777",
                  fontWeight: 400,
                  marginTop: -4,
                }}
              >
                University Name
              </div>

              {/* Quote */}
              <p
                style={{
                  fontSize: "0.78rem",
                  lineHeight: 1.85,
                  color: B,
                  margin: "8px 0 0",
                  flex: 1,
                }}
              >
                {LOREM}
              </p>

              {/* Stars */}
              <div style={{ marginTop: 8 }}>
                <Stars count={p.stars} />
              </div>
            </div>
          ))}
        </div>

        {/* Arrows + page indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 32,
          }}
        >
          <ArrowBtn disabled={page === 0} onClick={prev}>
            ←
          </ArrowBtn>
          <ArrowBtn disabled={page >= TOTAL_PAGES - 1} onClick={next}>
            →
          </ArrowBtn>
          <span
            style={{
              fontSize: "0.7rem",
              color: "#999",
              letterSpacing: "0.1em",
              marginLeft: 4,
            }}
          >
            {page + 1} / {TOTAL_PAGES}
          </span>
        </div>
      </div>
    </section>
  );
}
