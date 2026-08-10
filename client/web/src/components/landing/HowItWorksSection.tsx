import { STEPS } from "../../page/dto/LandingPage.dto";

export function HowItWorksSection() {
  return (
    <section className="py-24 px-6 md:px-16 reveal">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12">
          <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold text-foreground/45 uppercase tracking-[0.14em] border border-foreground/20 rounded-full px-3 py-1 mb-4">
            How it works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight">
            Three steps. Zero complexity.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="bg-card rounded-sm p-6 border border-border shadow-[0_4px_12px_-4px_rgba(14,15,12,0.12)]"
            >
              <p className="text-5xl font-bold text-card-foreground/20 tracking-tight leading-none mb-4">
                {s.n}
              </p>
              <h3 className="text-sm font-semibold text-card-foreground mb-2">{s.title}</h3>
              <p className="text-xs text-card-foreground/60 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
