import { safeParse } from "./json";
import type { LibraryState } from "../types/progress";

export const LIBRARY_KEY = "archbench:library:progress";

const defaultState = (): LibraryState => ({ progress: {} });

const hasWindow = () => typeof window !== "undefined" && typeof window.localStorage !== "undefined";

export function loadProgress(): LibraryState {
  if (!hasWindow()) {
    return defaultState();
  }
  const raw = window.localStorage.getItem(LIBRARY_KEY);
  if (!raw) {
    return defaultState();
  }
  const parsed = safeParse<LibraryState>(raw);
  if (!parsed || typeof parsed !== "object" || typeof parsed.progress !== "object" || parsed.progress === null) {
    return defaultState();
  }
  return {
    progress: Object.fromEntries(
      Object.entries(parsed.progress).map(([slug, payload]) => [
        slug,
        {
          slug,
          solved: Boolean(payload?.solved),
          attempts: typeof payload?.attempts === "number" ? payload.attempts : 0,
          lastScore: typeof payload?.lastScore === "number" ? payload.lastScore : undefined,
          updatedAt: typeof payload?.updatedAt === "string" ? payload.updatedAt : undefined,
        },
      ]),
    ),
  };
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

