import type { NodeDelta } from "@/compare/diff";
import { deltaClass, describeDelta, fmtCost, fmtMs, fmtRps } from "@/compare/diff";
import { cn } from "@/lib/utils";

type Props = {
  delta?: NodeDelta;
};

const METRICS = [
  { key: "dLatencyMs" as const, label: "Δp95", metric: "latency" as const, formatter: fmtMs },
  { key: "dCapacityRps" as const, label: "Δrps", metric: "capacity" as const, formatter: fmtRps },
  { key: "dCost" as const, label: "Δ$/h", metric: "cost" as const, formatter: fmtCost },
];

export function NodeOverlay({ delta }: Props) {
  if (!delta) {
    return null;
  }

  const chips = METRICS.map(({ key, label, metric, formatter }) => {
    const value = delta[key];
    if (value === undefined) {
      return null;
    }
    const arrow = value === 0 ? "→" : value > 0 ? "↑" : "↓";
    const formatted = formatter(value);
    if (!formatted) {
      return null;
    }
    const ariaLabel = `${label} ${describeDelta(metric, value)}`;
    return (
      <div
        key={key}
        className="flex items-center gap-1 rounded bg-black/60 px-1.5 py-0.5 text-[11px] text-white shadow dark:bg-white/15 dark:text-white/90"
        aria-label={ariaLabel}
        data-testid={`node-overlay-${delta.id}-${key}`}
      >
        <span className={cn("font-semibold", deltaClass(metric, value))}>{arrow}</span>
        <span className="font-medium text-white">{label}</span>
        <span className="text-[11px] text-white/90">{formatted}</span>
      </div>
    );
  }).filter(Boolean);

  if (!chips.length) {
    return null;
  }

  return <div className="pointer-events-none absolute right-1 top-1 space-y-0.5 text-[11px] leading-tight">{chips}</div>;
}

export default NodeOverlay;
