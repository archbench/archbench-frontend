import { cn } from "@/lib/utils";
import type { RubricBreakdown } from "@/types/grading";
import { formatUnit, getDeltaBadge, getRubricLabel } from "@/utils/rubric";

type Props = {
  breakdown: RubricBreakdown;
};

const toneClasses: Record<"positive" | "negative" | "neutral", string> = {
  positive: "bg-success/15 text-success",
  negative: "bg-danger/15 text-danger",
  neutral: "bg-muted/15 text-muted",
};

export default function GoalBar({ breakdown }: Props) {
  const label = getRubricLabel(breakdown.kind);
  const targetValue = breakdown.target ?? breakdown.actual;
  const maxValue = Math.max(breakdown.actual, targetValue) * 1.25 || 1;
  const actualPercent = Math.min(100, (breakdown.actual / maxValue) * 100);
  const targetPercent = breakdown.target ? Math.min(100, (breakdown.target / maxValue) * 100) : null;
  const badge = getDeltaBadge(breakdown);
  const achievedLabel = breakdown.passed ? "Target met" : "Needs work";
  const barColor = breakdown.target ? (breakdown.passed ? "bg-success" : "bg-danger") : "bg-warning";

  return (
    <div className="space-y-2 rounded-lg border border-border/60 p-4 dark:border-borderDark">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-text dark:text-white">{label}</span>
        <span className={cn("text-xs font-semibold", breakdown.passed ? "text-success" : "text-warning")}>
          {achievedLabel}
        </span>
      </div>
      <div className="relative h-2 w-full rounded-md bg-black/10 dark:bg-white/10">
        <div className={cn("absolute inset-y-0 rounded-md", barColor)} style={{ width: `${actualPercent}%` }} />
        {targetPercent !== null ? (
          <div
            className="absolute inset-y-[-4px] w-0.5 rounded-full bg-primary"
            style={{ left: `calc(${targetPercent}% - 1px)` }}
            aria-hidden="true"
          />
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted">
        <span>
          {formatUnit(breakdown.unit, breakdown.actual)} <span className="text-muted">actual</span>
        </span>
        <div className="flex items-center gap-2">
          <span>
            {breakdown.target !== undefined
              ? `${formatUnit(breakdown.unit, breakdown.target)} target`
              : "No target"}
          </span>
          <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold", toneClasses[badge.intent])}>
            <span aria-hidden="true">{badge.symbol}</span>
            {badge.label}
          </span>
        </div>
      </div>
    </div>
  );
}

