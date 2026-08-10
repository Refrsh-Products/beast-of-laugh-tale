export function FlashcardStage() {
  return (
    <div
      className="relative h-[460px] hidden lg:block [perspective:1600px]"
      aria-hidden="true"
    >
      {/* Back card 2 */}
      <div className="absolute inset-0 rounded-sm bg-[var(--paper-back2)] opacity-40 [transform:rotate(3deg)_translate(8px,-4px)]" />
      {/* Back card 1 */}
      <div className="absolute inset-0 rounded-sm bg-[var(--paper-back1)] opacity-55 [transform:rotate(-4deg)_translate(-10px,8px)]" />
      {/* Front card */}
      <div className="absolute inset-0 rounded-sm bg-card text-card-foreground border border-border p-6 flex flex-col shadow-[0_30px_60px_-30px_rgba(25,57,46,0.45),0_8px_24px_-12px_rgba(14,15,12,0.18)] [animation:tilt_6s_ease-in-out_infinite] motion-reduce:[animation:none]">
        <div className="flex items-center justify-between text-xs text-card-foreground/60 font-semibold uppercase tracking-wider">
          <span>Biology 201 · Deck 03</span>
          <span className="bg-foreground text-background px-2 py-0.5 rounded-sm">FRESHR</span>
        </div>
        <div className="flex-1 flex items-center justify-center px-6 text-center text-lg md:text-xl font-semibold leading-snug tracking-tight text-card-foreground">
          The phosphate group of a nucleotide is attached to the
          <span className="inline-block min-w-[80px] h-[1.1em] border-b-2 border-dashed border-primary-foreground mx-1 bg-[linear-gradient(transparent_60%,rgba(180,255,110,0.5)_60%)]" />
          carbon of the sugar.
        </div>
        <div className="flex items-center justify-between text-xs text-card-foreground/60">
          <span className="flex items-center gap-1">
            <span className="text-primary">◆</span> Tap to flip
          </span>
          <span>3 of 28</span>
        </div>
      </div>
      {/* Peek shadow */}
      <div className="absolute -bottom-5 left-0 right-0 h-7 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0.35),transparent_70%)] blur-md" />
    </div>
  );
}
