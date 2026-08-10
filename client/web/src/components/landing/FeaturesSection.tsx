import { FEATURES } from "../../page/dto/LandingPage.dto";
import { FeatureCard } from "./FeatureCard";

export function FeaturesSection() {
  return (
    <section className="lp-theme-section-light py-24 px-6 md:px-16 reveal">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
          <span className="inline-flex items-center gap-1.5 text-[0.65rem] font-semibold text-foreground/50 uppercase tracking-[0.14em] border border-foreground/20 rounded-full px-3 py-1 mb-4">
            Features
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight leading-tight">
            Everything your notes deserve.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f, i) => (
            <FeatureCard key={i} {...f} />
          ))}
        </div>
      </div>
    </section>
  );
}
