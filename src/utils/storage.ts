import { safeParse } from "./json";
import type { LibraryState, PresetProgress } from "../types/progress";

export const LIBRARY_KEY = "archbench:library:progress";

const defaultState = (): LibraryState => ({ progress: {} });

const hasWindow = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

const sanitizeEntry = (slug: string, payload: Partial<PresetProgress> | null | undefined): PresetProgress => ({
  slug,
  solved: Boolean(payload?.solved),
  attempts: typeof payload?.attempts === "number" && payload.attempts > 0 ? Math.floor(payload.attempts) : 0,
  lastScore: typeof payload?.lastScore === "number" ? payload.lastScore : undefined,
  updatedAt: typeof payload?.updatedAt === "string" ? payload.updatedAt : undefined,
});

const normalizeState = (raw: unknown): LibraryState | null => {
  if (!raw || typeof raw !== "object" || raw === null) {
    return null;
  }
  const candidate = (raw as { progress?: unknown }).progress;
  if (!candidate || typeof candidate !== "object") {
    return null;
  }
  const entries: Record<string, PresetProgress> = {};
  Object.entries(candidate as Record<string, unknown>).forEach(([slug, payload]) => {
    if (!slug) {
      return;
    }
    entries[slug] = sanitizeEntry(slug, (payload ?? null) as Partial<PresetProgress> | null);
  });
  return { progress: entries };
};

export function loadProgress(): LibraryState {
  if (!hasWindow()) {
    return defaultState();
  }
  const raw = window.localStorage.getItem(LIBRARY_KEY);
  if (!raw) {
    return defaultState();
  }
  const parsed = safeParse<unknown>(raw);
  return normalizeState(parsed) ?? defaultState();
}

export function saveProgress(state: LibraryState): void {
  if (!hasWindow()) {
    return;
  }
  try {
    window.localStorage.setItem(LIBRARY_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Failed to persist library progress", error);
  }
}

export function normalizeProgressState(raw: unknown): LibraryState | null {
  return normalizeState(raw);
}

export function replaceProgressState(next: LibraryState): LibraryState {
  const normalized = normalizeState(next) ?? defaultState();
  saveProgress(normalized);
  return normalized;
}

export function bumpAttempt(slug: string, score?: number): LibraryState {
  const state = loadProgress();
  const existing = state.progress[slug] ?? {
    slug,
    solved: false,
    attempts: 0,
  };
  const attempts = existing.attempts + 1;
  const updated = {
    ...existing,
    attempts,
    lastScore: typeof score === "number" ? score : existing.lastScore,
    updatedAt: new Date().toISOString(),
  };
  state.progress[slug] = updated;
  saveProgress(state);
  return state;
}

export function setSolved(slug: string, solved: boolean): LibraryState {
  const state = loadProgress();
  const existing = state.progress[slug] ?? {
    slug,
    solved: false,
    attempts: 0,
  };
  state.progress[slug] = {
    ...existing,
    solved,
    updatedAt: new Date().toISOString(),
  };
  saveProgress(state);
  return state;
}
