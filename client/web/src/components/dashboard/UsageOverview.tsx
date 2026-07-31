import type { AccountUseage } from "@freshr/shared";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { RiDonutChartLine, RiArrowRightLine } from "@remixicon/react";

/** Renders bytes as KB/MB/GB so the storage tile reads like the others. */
function formatBytes(bytes: number): string {
  if (bytes >= 1_073_741_824) return `${(bytes / 1_073_741_824).toFixed(1)}GB`;
  if (bytes >= 1_048_576) return `${Math.round(bytes / 1_048_576)}MB`;
  return `${Math.round(bytes / 1_024)}KB`;
}

interface Metric {
  label: string;
  used: number;
  limit: number;
  display: string;
}

function UsageTile({ metric }: { metric: Metric }) {
  // Clamped because usage can exceed the limit after a plan downgrade — an
  // unclamped bar would overflow its track and report a nonsense percentage.
  const pct =
    metric.limit > 0
      ? Math.min(100, Math.round((metric.used / metric.limit) * 100))
      : 0;

  return (
    <Card className="gap-0 py-0">
      <CardContent className="flex flex-col gap-3 px-4 py-3.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-muted-foreground text-xs font-medium tracking-[0.08em] uppercase">
            {metric.label}
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {metric.display}
          </span>
        </div>
        <Progress
          value={pct}
          aria-label={`${metric.label} usage`}
          className="h-1.5"
        />
      </CardContent>
    </Card>
  );
}

export default function UsageOverview({
  usage,
  onUpgrade,
}: {
  usage: AccountUseage;
  onUpgrade: () => void;
}) {
  const storageUsed = Number(usage.storage.used_bytes);
  const storageLimit = Number(usage.storage.limit_bytes);

  const metrics: Metric[] = [
    {
      label: "Notebooks",
      used: usage.notebooks.used,
      limit: usage.notebooks.limit,
      display: `${usage.notebooks.used} of ${usage.notebooks.limit}`,
    },
    {
      label: "Storage",
      used: storageUsed,
      limit: storageLimit,
      display: `${formatBytes(storageUsed)} of ${formatBytes(storageLimit)}`,
    },
    {
      label: "Daily quizzes",
      used: usage.daily_quizzes.used,
      limit: usage.daily_quizzes.limit,
      display: `${usage.daily_quizzes.used} of ${usage.daily_quizzes.limit}`,
    },
    {
      label: "Presentations",
      used: usage.presentations.used,
      limit: usage.presentations.limit,
      display: `${usage.presentations.used} of ${usage.presentations.limit}`,
    },
  ];

  const isFreePlan = usage.plan?.toLowerCase() === "free";

  return (
    <section aria-labelledby="usage-overview-heading" className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="usage-overview-heading"
          className="flex items-center gap-2 text-base font-semibold"
        >
          <RiDonutChartLine className="text-primary size-5" aria-hidden="true" />
          Usage overview
          <span className="text-muted-foreground ml-1 text-xs font-medium tracking-[0.08em] uppercase">
            {usage.plan}
          </span>
        </h2>
        {isFreePlan && (
          <Button variant="secondary" size="sm" onClick={onUpgrade}>
            Upgrade to Pro
            <RiArrowRightLine aria-hidden="true" />
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <UsageTile key={metric.label} metric={metric} />
        ))}
      </div>
    </section>
  );
}
