const G = "#84e487";
const B = "#000000";
const W = "#FFFFFF";

const TESTIMONIALS = [
  {
    name: "Mushfiqur Rahman Zaed",
    university: "Independent University, Bangladesh",
    quote: "It saved me so much time. Whether I'm preparing a presentation or getting ready for a quiz, FRESHR has me completely covered.",
    stars: 5,
  },
  {
    name: "Mushfika Zerin Zemima",
    university: "Independent University, Bangladesh",
    quote: "It gives you a proper online quiz and shows you the answers — that's exactly what I needed.",
    stars: 4,
  },
  {
    name: "Adnan Shihab",
    university: "Independent University, Bangladesh",
    quote: "Even though it's still in development with just two features, both of them are genuinely helpful for saving students' time.",
    stars: 4,
  },
  {
    name: "Humaira Afnan Rowza",
    university: "Independent University, Bangladesh",
    quote: "It helped me with my MCQs and gave me a much clearer understanding of my lecture material.",
    stars: 4,
  },
  {
    name: "Sababa Shornil",
    university: "Independent University, Bangladesh",
    quote: "I used it right before my exams and it worked really well. It helped me cover most of the syllabus efficiently — something I always struggled with since I tend to only start studying the day before.",
    stars: 5,
  },
];

// Row 1: columns 1-2, 3-4, 5-6. Row 2: columns 2-3, 4-5 (centered).
const GRID_COLUMNS = ["1 / span 2", "3 / span 2", "5 / span 2", "2 / span 2", "4 / span 2"];

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

export default function TestimonialSection() {
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
              background: B,
              color: W,
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

        {/* Single 6-column grid — row 1: 3 cards, row 2: 2 cards centered */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(6, 1fr)",
            gap: 20,
          }}
        >
          {TESTIMONIALS.map((t, i) => (
            <div
              key={t.name}
              style={{
                gridColumn: GRID_COLUMNS[i],
                border: `3px solid ${B}`,
                padding: "28px 24px",
                background: W,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              <div
                style={{
                  fontFamily: "'Syne', sans-serif",
                  fontWeight: 800,
                  fontSize: "1rem",
                  letterSpacing: "-0.01em",
                }}
              >
                {t.name}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: "#777",
                  fontWeight: 400,
                  marginTop: -4,
                }}
              >
                {t.university}
              </div>
              <p
                style={{
                  fontSize: "0.78rem",
                  lineHeight: 1.85,
                  color: B,
                  margin: "8px 0 0",
                  flex: 1,
                }}
              >
                {t.quote}
              </p>
              <div style={{ marginTop: 8 }}>
                <Stars count={t.stars} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
