import { useRevealOnScroll } from "../hooks/useRevealOnScroll";
import { LandingNav } from "../components/landing/LandingNav";
import { HeroSection } from "../components/landing/HeroSection";
import { StatsSection } from "../components/landing/StatsSection";
import { FeaturesSection } from "../components/landing/FeaturesSection";
import { HowItWorksSection } from "../components/landing/HowItWorksSection";
import { TestimonialSection } from "../components/landing/TestimonialSection";
import { PricingSection } from "../components/landing/PricingSection";
import { CTABand } from "../components/landing/CTABand";
import { LandingFooter } from "../components/landing/LandingFooter";

export default function LandingPage() {
  const revealRef = useRevealOnScroll();

  return (
    <div className="lp-theme bg-background text-foreground" ref={revealRef}>
      <LandingNav />
      <HeroSection />
      <StatsSection />
      <FeaturesSection />
      <HowItWorksSection />
      <TestimonialSection />
      <PricingSection />
      <CTABand />
      <LandingFooter />
    </div>
  );
}
