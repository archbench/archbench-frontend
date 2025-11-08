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
      role="status"
      aria-live="polite"
      aria-atomic="true"
      title={label}
      className={`inline-flex items-center gap-1 rounded-md px-3 py-1 text-sm font-semibold ${statusClasses[status]}`}
    >
      {label}
    </span>
  );
}
