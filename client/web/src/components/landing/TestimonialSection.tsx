import { Star } from "lucide-react";
import { useMediaQuery } from "../../hooks/useMediaQuery";
import { BP_PHONE } from "../../constants/breakpoints";

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

const GRID_COLUMNS = ["1 / span 2", "3 / span 2", "5 / span 2", "2 / span 2", "4 / span 2"];

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) =>
        i <= count ? (
          <Star key={i} className="h-3.5 w-3.5 text-primary" fill="currentColor" />
        ) : (
          <Star key={i} className="h-3.5 w-3.5 text-card-foreground/30" />
        ),
      )}
    </div>
  );
}

function TestimonialCard({
  t,
  style,
}: {
  t: (typeof TESTIMONIALS)[number];
  style?: React.CSSProperties;
}) {
  return (
    <div
      className="rounded-sm bg-card border border-border p-6 flex flex-col gap-3 shadow-[0_4px_12px_-4px_rgba(14,15,12,0.12)]"
      style={style}
    >
      <div className="flex-1">
        <p className="text-sm text-card-foreground leading-relaxed">"{t.quote}"</p>
      </div>
      <div>
        <Stars count={t.stars} />
        <p className="text-sm font-medium text-card-foreground mt-2">{t.name}</p>
        <p className="text-xs text-card-foreground/60 mt-0.5">{t.university}</p>
      </div>
    </div>
  );
}

export function TestimonialSection() {
  const isPhone = useMediaQuery(BP_PHONE);

  return (
    <section className="py-24 px-6 md:px-16 border-b border-border reveal">
      <div className="max-w-7xl mx-auto">
        <div className="mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-card-foreground/50 uppercase tracking-wider border border-card-foreground/15 rounded-full px-3 py-1 mb-4">
            Testimonials
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight">
            What students are saying.
          </h2>
        </div>

        {isPhone ? (
          <div
            className="flex gap-4 overflow-x-auto pb-3 -mx-6 px-6"
            style={{ scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch" }}
          >
            {TESTIMONIALS.map((t) => (
              <div key={t.name} style={{ flex: "0 0 auto", width: "min(85vw, 320px)", scrollSnapAlign: "start" }}>
                <TestimonialCard t={t} />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-4">
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.name} t={t} style={{ gridColumn: GRID_COLUMNS[i] }} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
