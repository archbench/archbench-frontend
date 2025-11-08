export interface PresetProgress {
  slug: string;
  solved: boolean;
  attempts: number;
  lastScore?: number;
  updatedAt?: string;
}

export interface LibraryState {
  progress: Record<string, PresetProgress>;
}

