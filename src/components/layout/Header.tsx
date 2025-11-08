import type { ReactNode } from "react";
import Button from "../common/Button";
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
        <Button onClick={onCheckEngine} variant="secondary">
          Check Engine
        </Button>
        <Button onClick={onRun} variant="primary">
          Run Simulation
        </Button>
        <Button onClick={onNewScenario} variant="secondary">
          New Scenario
        </Button>
        <Button onClick={onSaveSnapshotA} disabled={disableSave} variant="secondary">
          Save Snapshot A
        </Button>
        <Button onClick={onSaveSnapshotB} disabled={disableSave} variant="secondary">
          Save Snapshot B
        </Button>
        <Button onClick={onCompare} variant="primary">
          Compare
        </Button>
        <StatusPill status={status} label={statusMessage} />
      </div>
    </div>
  );
}
