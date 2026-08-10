const STATS: [string, string][] = [
  ["1", "Place for everything"],
  ["∞", "Documents"],
  ["0", "Lost notes"],
  ["100%", "Private and secure"],
];

export function StatsSection() {
  return (
    <section className="py-20 px-6 md:px-16 reveal">
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {STATS.map(([n, l]) => (
          <div
            key={l}
            className="relative bg-card rounded-sm p-6 text-center border border-border shadow-[0_4px_12px_-4px_rgba(14,15,12,0.12)] overflow-hidden"
          >
            <div className="absolute top-0 left-0 right-0 h-[3px] bg-primary" />
            <p className="text-4xl md:text-5xl font-bold text-card-foreground tracking-tight leading-none mt-2">
              {n}
            </p>
            <div className="mx-auto mt-3 h-0.5 w-6 rounded-full bg-card-foreground/15" />
            <p className="text-xs text-card-foreground/60 mt-3 uppercase tracking-wider">{l}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
