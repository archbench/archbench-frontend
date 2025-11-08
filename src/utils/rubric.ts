import type { Scenario, SimulationResult } from "@/types/api";
import type { RubricBreakdown, RubricKind } from "@/types/grading";

type Direction = RubricBreakdown["direction"];

const RUBRIC_LABELS: Record<RubricKind, string> = {
  p95: "Latency p95",
  throughput: "Throughput",
  cost: "Cost / hour",
};

const UNIT_FORMATTERS: Record<RubricBreakdown["unit"], (value: number) => string> = {
  ms: (value) => `${value.toFixed(0)} ms`,
  rps: (value) => `${value.toLocaleString()} rps`,
  "$h": (value) => `$${value.toFixed(2)}/h`,
};

const isNumber = (value: unknown): value is number => typeof value === "number" && !Number.isNaN(value);

const buildBreakdown = (
  kind: RubricKind,
  actual: number,
  target: number | undefined,
  unit: RubricBreakdown["unit"],
  direction: Direction,
): RubricBreakdown => {
  const hasTarget = isNumber(target);
  const delta = hasTarget
    ? direction === "lte"
      ? actual - (target as number)
      : (target as number) - actual
    : 0;
  const passed = hasTarget
    ? direction === "lte"
      ? actual <= (target as number)
      : actual >= (target as number)
    : false;

  return {
    kind,
    actual,
    target: hasTarget ? (target as number) : undefined,
    unit,
    direction,
    passed,
    delta,
  };
};

export const buildRubric = (result: SimulationResult, scenario?: Scenario | null): RubricBreakdown[] => {
  const breakdowns: RubricBreakdown[] = [];
  const workload = scenario?.workload;

  breakdowns.push(
    buildBreakdown("p95", result.latencyMsP95, workload?.p95TargetMs, "ms", "lte"),
    buildBreakdown("throughput", result.throughputRps, workload?.rps, "rps", "gte"),
  );

  if (isNumber(result.costPerHour)) {
    breakdowns.push(buildBreakdown("cost", result.costPerHour, workload?.costTargetPerHour, "$h", "lte"));
  }

  return breakdowns;
};

export const formatUnit = (unit: RubricBreakdown["unit"], value: number): string => {
  const formatter = UNIT_FORMATTERS[unit];
  return formatter(value);
};

export const getRubricLabel = (kind: RubricKind): string => RUBRIC_LABELS[kind];

export type DeltaIntent = "positive" | "negative" | "neutral";
export interface DeltaBadge {
  label: string;
  intent: DeltaIntent;
  symbol: "↑" | "↓" | "—";
}

export const getDeltaBadge = (breakdown: RubricBreakdown): DeltaBadge => {
  if (!isNumber(breakdown.target)) {
    return { label: "No target", intent: "neutral", symbol: "—" };
  }

  const magnitude = Math.abs(breakdown.delta);
  if (magnitude < 0.01) {
    return { label: "On target", intent: "neutral", symbol: "—" };
  }

  const better = breakdown.delta < 0;
  const formatted = formatUnit(breakdown.unit, magnitude);
  return better
    ? { label: `${formatted} better`, intent: "positive", symbol: "↓" }
    : { label: `${formatted} gap`, intent: "negative", symbol: "↑" };
};

