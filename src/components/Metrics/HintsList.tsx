import { Badge } from "../ui/badge";

type Props = {
  hints: string[] | null | undefined;
};

export default function HintsList({ hints }: Props) {
  const cleanedHints = hints?.map((hint) => hint.trim()).filter(Boolean) ?? [];

  if (!cleanedHints.length) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted shadow-subtle dark:border-borderDark dark:bg-surfaceDark"
      >
        No hints for this run.
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-border bg-surface p-5 shadow-subtle dark:border-borderDark dark:bg-surfaceDark"
    >
      <div className="flex flex-wrap gap-2">
        {cleanedHints.map((_, index) => (
          <Badge key={`hint-pill-${index}`} variant="secondary">
            Hint {index + 1}
          </Badge>
        ))}
      </div>
      <ul className="mt-4 list-disc space-y-2 pl-5 text-sm text-text dark:text-white">
        {cleanedHints.map((hint, index) => (
          <li key={`hint-${index}`}>{hint}</li>
        ))}
      </ul>
    </div>
  );
}
