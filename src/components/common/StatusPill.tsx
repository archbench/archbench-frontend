export type RunStatus = "idle" | "running" | "error" | "success";

type Props = {
  status: RunStatus;
  label: string;
};

const statusClasses: Record<RunStatus, string> = {
  idle: "text-muted",
  running: "text-primary animate-pulse",
  error: "text-danger",
  success: "text-success",
};

export default function StatusPill({ status, label }: Props) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-muted/40 bg-white/80 px-3 py-1 text-sm font-semibold leading-none dark:border-white/20 dark:bg-white/10 ${statusClasses[status]}`}
      aria-live="polite"
    >
      {label}
    </span>
  );
}
