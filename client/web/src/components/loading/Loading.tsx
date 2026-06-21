export default function Loading() {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background gap-3">
      <div className="w-8 h-8 rounded-full border-2 border-border border-t-primary animate-spin" />
      <span className="text-sm text-muted-foreground">Loading...</span>
    </div>
  );
}
