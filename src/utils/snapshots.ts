import type { Snapshot } from '../types/snapshots';

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
      !parsed.result
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
