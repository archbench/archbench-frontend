import Button from "./Button";
import StatusPill, { type RunStatus } from "./StatusPill";

type Props = {
  disableSave: boolean;
  status: RunStatus;
  statusMessage: string;
  activeView: "editor" | "library";
  onCheckEngine: () => void;
  onRun: () => void;
  onNewScenario: () => void;
  onSaveSnapshotA: () => void;
  onSaveSnapshotB: () => void;
  onCompare: () => void;
  onViewChange: (view: "editor" | "library") => void;
};

export default function Toolbar({
  disableSave,
  status,
  statusMessage,
  activeView,
  onCheckEngine,
  onRun,
  onNewScenario,
  onSaveSnapshotA,
  onSaveSnapshotB,
  onCompare,
  onViewChange,
}: Props) {
  return (
    <div className="z-toolbar w-full border-b border-border bg-surface px-6 py-3 dark:border-borderDark dark:bg-surfaceDark">
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
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant={activeView === "library" ? "primary" : "ghost"}
            onClick={() => onViewChange(activeView === "library" ? "editor" : "library")}
            aria-pressed={activeView === "library"}
            aria-label={activeView === "library" ? "Return to editor" : "Open preset library"}
          >
            {activeView === "library" ? "Back to Editor" : "Library"}
          </Button>
          <StatusPill status={status} label={statusMessage} />
        </div>
      </div>
    </div>
  );
}
