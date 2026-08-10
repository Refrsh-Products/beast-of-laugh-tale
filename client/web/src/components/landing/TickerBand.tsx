import { TICKER_TEXT } from "../../page/dto/LandingPage.dto";

export function TickerBand() {
  return (
    <div className="overflow-hidden py-4 border-y border-border/30 bg-primary/5">
      <div className="flex whitespace-nowrap animate-[ticker_40s_linear_infinite] motion-reduce:animate-none">
        <span className="text-sm font-medium text-foreground/40 uppercase tracking-wider pr-12">
          {TICKER_TEXT}
        </span>
        <span className="text-sm font-medium text-foreground/40 uppercase tracking-wider pr-12">
          {TICKER_TEXT}
        </span>
      </div>
    </div>
  );
}
