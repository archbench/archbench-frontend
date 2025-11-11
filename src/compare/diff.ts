import type { Scenario } from "@/types/api";

export interface NodeDelta {
  id: string;
  dLatencyMs?: number;
  dCapacityRps?: number;
  dCost?: number;
}

export interface EdgeDelta {
  id: string;
  note?: string;
}

type DeltaMetric = "latency" | "capacity" | "cost";

const diff = (next?: number, prev?: number) => {
  if (typeof next !== "number" || typeof prev !== "number") {
    return undefined;
  }
  return next - prev;
};

const formatMagnitude = (value: number) => {
  const abs = Math.abs(value);
  if (abs >= 1000) {
    return abs.toFixed(0);
  }
  if (abs >= 10) {
    return abs.toFixed(1);
  }
  return abs.toFixed(2);
};

const signed = (value: number) => {
  if (value > 0) {
    return `+${formatMagnitude(value)}`;
  }
  if (value < 0) {
    return `-${formatMagnitude(value)}`;
  }
  return "0";
};

export function buildNodeDeltas(snapA?: Scenario | null, snapB?: Scenario | null): NodeDelta[] {
  if (!snapA || !snapB) {
    return [];
  }
  const nodesA = snapA.nodes ?? [];
  const nodesB = snapB.nodes ?? [];
  const mapB = new Map(nodesB.map((node) => [node.id, node]));

  return nodesA
    .map<NodeDelta | null>((node) => {
      const other = mapB.get(node.id);
      if (!other) {
        return null;
      }
      const delta: NodeDelta = { id: node.id };

      const dLatencyMs = diff(other.latencyMs, node.latencyMs);
      const dCapacityRps = diff(other.capacityRps, node.capacityRps);
      const dCost = diff(other.costPerHour, node.costPerHour);

      if (dLatencyMs !== undefined) {
        delta.dLatencyMs = dLatencyMs;
      }
      if (dCapacityRps !== undefined) {
        delta.dCapacityRps = dCapacityRps;
      }
      if (dCost !== undefined) {
        delta.dCost = dCost;
      }

      if (delta.dLatencyMs === undefined && delta.dCapacityRps === undefined && delta.dCost === undefined) {
        return null;
      }

      return delta;
    })
    .filter((delta): delta is NodeDelta => Boolean(delta));
}

export function deltaClass(metric: DeltaMetric, value?: number) {
  if (value === undefined || value === 0) {
    return "text-textMuted";
  }
  const isPositive = value > 0;
  const positiveIsGood = metric === "capacity";
  const isGood = positiveIsGood ? isPositive : !isPositive;
  return isGood ? "text-success" : "text-danger";
}

export function fmtMs(value?: number) {
  if (value === undefined) {
    return null;
  }
  return `${signed(value)} ms`;
}

export function fmtRps(value?: number) {
  if (value === undefined) {
    return null;
  }
  return `${signed(value)} rps`;
}

export function fmtCost(value?: number) {
  if (value === undefined) {
    return null;
  }
  return `${signed(value)} $/h`;
}

export function describeDelta(metric: DeltaMetric, value?: number) {
  if (value === undefined || value === 0) {
    return `${metric} unchanged`;
  }
  const adjective = value > 0 ? "increased" : "decreased";
  const units = metric === "capacity" ? "rps" : metric === "cost" ? "$/h" : "ms";
  return `${metric} ${adjective} by ${formatMagnitude(value)} ${units}`;
}
