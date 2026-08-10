import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export function CTABand() {
  const navigate = useNavigate();

  return (
    <section className="py-24 px-6 md:px-16 border-b border-border text-center reveal">
      <div className="max-w-xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">
          Start studying smarter<br />
          <span className="text-primary">today.</span>
        </h2>
        <p className="text-sm text-muted-foreground mb-8 leading-relaxed">
          Free to start. No credit card required. Your notes, your AI.
        </p>
        <button
          onClick={() => navigate("/signup")}
          className="inline-flex items-center gap-2 rounded-sm bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:-translate-y-px"
        >
          Get started free
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </section>
  );
}
