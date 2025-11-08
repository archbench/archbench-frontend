type Props = {
  score: number | undefined | null;
};

const tones = {
  muted: {
    border: "border-border dark:border-borderDark",
    bg: "bg-surface dark:bg-surfaceDark",
    text: "text-text",
    helper: "text-muted",
    message: "Waiting for engine to return a score.",
  },
  danger: {
    border: "border-danger/40",
    bg: "bg-danger/5",
    text: "text-danger",
    helper: "text-danger",
    message: "Significant regressions detected. Work through the hints below.",
  },
  warning: {
    border: "border-warning/40",
    bg: "bg-warning/5",
    text: "text-warning",
    helper: "text-warning",
    message: "Mixed results. Review the hints to tighten latency or cost targets.",
  },
  success: {
    border: "border-success/40",
    bg: "bg-success/5",
    text: "text-success",
    helper: "text-success",
    message: "Healthy margin across the current workload targets.",
  },
};

export default function ScoreCard({ score }: Props) {
  const hasScore = typeof score === "number" && Number.isFinite(score);
  const normalized = hasScore ? Math.max(0, Math.min(100, Math.round(score!))) : null;
  const level =
    normalized === null
      ? "muted"
      : normalized >= 80
        ? "success"
        : normalized >= 50
          ? "warning"
          : "danger";
  const tone = tones[level as keyof typeof tones];

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-2xl border ${tone.border} ${tone.bg} p-5 shadow-subtle`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">Scenario Score</p>
      <p className={`mt-3 text-5xl font-bold leading-none ${tone.text}`}>
        {normalized !== null ? normalized : "—"}
      </p>
      <p className={`mt-2 text-sm ${tone.helper}`}>{tone.message}</p>
    </div>
  );
}

