import type { Snapshot } from '../types/snapshots';
import type { Scenario, SimulationResult, Node, Edge, Workload } from '../types/api';

export const SNAP_A_KEY = 'archbench:snapshot:A';
export const SNAP_B_KEY = 'archbench:snapshot:B';

export function saveSnapshot(key: string, snap: Snapshot): void {
  try {
    const serialized = JSON.stringify(snap);
    localStorage.setItem(key, serialized);
  } catch (error) {
    console.error('Failed to save snapshot', error);
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isWorkload(value: unknown): value is Workload {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const workload = value as Workload;
  if (
    workload.rps !== undefined &&
    !isFiniteNumber(workload.rps)
  ) {
    return false;
  }
  if (
    workload.p95TargetMs !== undefined &&
    !isFiniteNumber(workload.p95TargetMs)
  ) {
    return false;
  }
  return true;
}

function isNode(value: unknown): value is Node {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const node = value as Node;
  if (typeof node.id !== 'string' || typeof node.type !== 'string') {
    return false;
  }
  const numericFields: (keyof Node)[] = [
    'latencyMs',
    'varianceFactor',
    'capacityRps',
    'failureRate',
    'costPerHour',
  ];
  for (const key of numericFields) {
    const maybeValue = node[key];
    if (maybeValue !== undefined && !isFiniteNumber(maybeValue)) {
      return false;
    }
  }
  if (node.dbConfig !== undefined && node.dbConfig !== null && typeof node.dbConfig !== 'object') {
    return false;
  }
  return true;
}

function isEdge(value: unknown): value is Edge {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const edge = value as Edge;
  return typeof edge.from === 'string' && typeof edge.to === 'string';
}

function isScenario(value: unknown): value is Scenario {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const scenario = value as Scenario;
  if (typeof scenario.name !== 'string') {
    return false;
  }
  if (scenario.workload !== undefined && !isWorkload(scenario.workload)) {
    return false;
  }
  if (!Array.isArray(scenario.nodes) || !scenario.nodes.every(isNode)) {
    return false;
  }
  if (!Array.isArray(scenario.edges) || !scenario.edges.every(isEdge)) {
    return false;
  }
  return true;
}

function isSimulationResult(value: unknown): value is SimulationResult {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const result = value as SimulationResult;
  return (
    isFiniteNumber(result.latencyMsP50) &&
    isFiniteNumber(result.latencyMsP95) &&
    isFiniteNumber(result.throughputRps) &&
    isFiniteNumber(result.costPerHour) &&
    typeof result.status === 'string'
  );
}

export function loadSnapshot(key: string): Snapshot | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as Partial<Snapshot>;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.name !== 'string' ||
      typeof parsed.savedAt !== 'string' ||
      !parsed.scenario ||
      !isScenario(parsed.scenario) ||
      !parsed.result ||
      !isSimulationResult(parsed.result)
    ) {
      return null;
    }
    return parsed as Snapshot;
  } catch (error) {
    console.warn('Failed to load snapshot', error);
    return null;
  }
}

export function formatLocal(dtIso: string): string {
  const date = new Date(dtIso);
  if (Number.isNaN(date.getTime())) {
    return dtIso;
  }
  return date.toLocaleString(undefined, { dateStyle: 'short', timeStyle: 'short' });
}

export function delta(
  a: number | undefined,
  b: number | undefined
): { sign: 'up' | 'down' | 'flat'; abs: number; pct: number | null } {
  if (typeof a !== 'number' || typeof b !== 'number') {
    return { sign: 'flat', abs: 0, pct: null };
  }
  const difference = b - a;
  if (difference > 0) {
    return {
      sign: 'up',
      abs: difference,
      pct: a === 0 ? null : (difference / a) * 100,
    };
  }
  if (difference < 0) {
    return {
      sign: 'down',
      abs: difference,
      pct: a === 0 ? null : (difference / a) * 100,
    };
  }
  return { sign: 'flat', abs: 0, pct: a === 0 ? null : 0 };
}
