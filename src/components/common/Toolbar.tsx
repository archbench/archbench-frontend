import Button from "./Button";
import StatusPill, { type RunStatus } from "./StatusPill";

type Props = {
  disableSave: boolean;
  status: RunStatus;
  statusMessage: string;
  onCheckEngine: () => void;
  onRun: () => void;
  onNewScenario: () => void;
  onSaveSnapshotA: () => void;
  onSaveSnapshotB: () => void;
  onCompare: () => void;
};

export default function Toolbar({
  disableSave,
  status,
  statusMessage,
  onCheckEngine,
  onRun,
  onNewScenario,
  onSaveSnapshotA,
  onSaveSnapshotB,
  onCompare,
}: Props) {
  return (
    <div className="w-full border-b border-border bg-surface px-6 py-3 dark:border-borderDark dark:bg-surfaceDark">
      <div className="flex w-full flex-wrap items-center gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
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
          <Button onClick={onCompare} variant="secondary">
            Compare
          </Button>
        </div>
        <div className="ml-auto">
          <StatusPill status={status} label={statusMessage} />
        </div>
      </div>
    </div>
  );
}
