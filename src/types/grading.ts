import type { Scenario } from "@/types/api";

export type RubricKind = "p95" | "throughput" | "cost";

export interface RubricBreakdown {
  kind: RubricKind;
  target?: number;
  actual: number;
  unit: "ms" | "rps" | "$h";
  direction: "lte" | "gte";
  passed: boolean;
  delta: number;
}

export interface WhatIf {
  id: string;
  title: string;
  description: string;
  tag: string;
  apply: (scenario: Scenario) => Scenario;
  revert?: (scenario: Scenario) => Scenario;
  isApplied?: (scenario: Scenario) => boolean;
}

