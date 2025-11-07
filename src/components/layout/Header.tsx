import type { ReactNode } from "react";
import StatusPill, { type RunStatus } from "../common/StatusPill";

type Props = {
  scenarioName: string;
  status: RunStatus;
  statusMessage: string;
  disableSave: boolean;
  onCheckEngine: () => void;
  onRun: () => void;
  onNewScenario: () => void;
  onSaveSnapshotA: () => void;
  onSaveSnapshotB: () => void;
  onCompare: () => void;
  centerSlot?: ReactNode;
};

export default function Header({
  scenarioName,
  status,
  statusMessage,
  disableSave,
  onCheckEngine,
  onRun,
  onNewScenario,
  onSaveSnapshotA,
  onSaveSnapshotB,
  onCompare,
  centerSlot,
}: Props) {
  const buttonBase =
    "inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-0";
  const primaryButton = `${buttonBase} bg-primary text-white hover:opacity-90 focus-visible:ring-primary/50`;
  const secondaryButton = `${buttonBase} border border-muted/40 text-text dark:text-white hover:bg-black/5 dark:hover:bg-white/10 focus-visible:ring-muted/40`;

  return (
    <div className="sticky top-0 z-50 -mx-6 -my-2 flex w-full flex-wrap items-center justify-between gap-4 bg-white px-6 py-3 shadow-header dark:bg-zinc-900">
      <div className="min-w-[160px] flex-1 basis-full sm:basis-auto">
        <div className="flex flex-col gap-0.5">
          <span className="text-lg font-semibold text-primary">ArchBench</span>
          <span className="text-sm text-muted">{scenarioName}</span>
        </div>
      </div>

      <div className="flex min-w-[240px] flex-1 basis-full items-center gap-3 sm:basis-auto">
        {centerSlot}
      </div>

      <div className="flex flex-1 basis-full flex-wrap items-center justify-end gap-2 sm:basis-auto">
        <button type="button" className={secondaryButton} onClick={onCheckEngine}>
          Check Engine
        </button>
        <button type="button" className={primaryButton} onClick={onRun}>
          Run Simulation
        </button>
        <button type="button" className={secondaryButton} onClick={onNewScenario}>
          New Scenario
        </button>
        <button
          type="button"
          className={secondaryButton}
          onClick={onSaveSnapshotA}
          disabled={disableSave}
        >
          Save Snapshot A
        </button>
        <button
          type="button"
          className={secondaryButton}
          onClick={onSaveSnapshotB}
          disabled={disableSave}
        >
          Save Snapshot B
        </button>
        <button type="button" className={primaryButton} onClick={onCompare}>
          Compare
        </button>
        <StatusPill status={status} label={statusMessage} />
      </div>
    </div>
  );
}
