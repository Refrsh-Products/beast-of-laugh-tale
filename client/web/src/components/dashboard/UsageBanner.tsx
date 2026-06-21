import { cn } from "../../lib/utils";
import type { AccountUseage } from "@freshr/shared";

function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)} GB`;
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(1)} MB`;
  return `${(bytes / 1_024).toFixed(0)} KB`;
}

interface UsageBarProps {
  label: string;
  used: number;
  limit: number;
  formatValue?: (n: number) => string;
}

function UsageBar({ label, used, limit, formatValue = String }: UsageBarProps) {
  const pct = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;

  return (
    <div className="flex flex-col gap-1 min-w-32">
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>
          {formatValue(used)} / {formatValue(limit)}
        </span>
      </div>
      <div className="h-1 w-full rounded-full bg-secondary overflow-hidden">
        <div
          className={cn(
            "h-full rounded-full transition-all duration-300",
            pct >= 80 ? "bg-destructive" : pct >= 55 ? "bg-amber-500" : "bg-primary",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function UsageBanner({ usage }: { usage: AccountUseage }) {
  return (
    <div className="flex flex-wrap items-center gap-6 rounded-lg border border-border bg-secondary/20 px-4 py-3 mb-6">
      <span className="text-xs font-semibold text-foreground uppercase tracking-wider">
        {usage.plan}
      </span>

      <div className="w-px h-5 bg-border shrink-0" />

      <UsageBar label="Notebooks" used={usage.notebooks.used} limit={usage.notebooks.limit} />
      <UsageBar
        label="Storage"
        used={Number(usage.storage.used_bytes)}
        limit={Number(usage.storage.limit_bytes)}
        formatValue={formatBytes}
      />
      <UsageBar label="Quizzes" used={usage.daily_quizzes.used} limit={usage.daily_quizzes.limit} />
      <UsageBar label="Presentations" used={usage.presentations.used} limit={usage.presentations.limit} />
    </div>
  );
}
