import type { Scenario } from "./api";

export type Difficulty = "easy" | "medium" | "hard";

export interface PresetMeta {
  slug: string;
  name: string;
  category?: string;
  difficulty?: Difficulty;
  tags?: string[];
}

export interface PresetBrief {
  title: string;
  summary: string;
  workload?: {
    rps?: number;
    p95TargetMs?: number;
    costTargetPerHour?: number;
  };
}

export interface Preset {
  meta: PresetMeta;
  brief: PresetBrief;
  scenario: Scenario;
}
