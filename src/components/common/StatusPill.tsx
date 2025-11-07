export type RunStatus = "idle" | "running" | "error";

type Props = {
  status: RunStatus;
  label: string;
};

export default function StatusPill({ status, label }: Props) {
  return (
    <span className={`status-pill status-pill--${status}`} aria-live="polite">
      {label}
    </span>
  );
}
