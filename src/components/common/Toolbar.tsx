import Button from "./Button";
import StatusPill, { type RunStatus } from "./StatusPill";
import type { CompareOverlayMode } from "@/types/compare";

type Props = {
  disableSave: boolean;
  disableRun?: boolean;
  status: RunStatus;
  statusMessage: string;
  activeView: "editor" | "library";
  docsOpen: boolean;
  onCheckEngine: () => void;
  onRun: () => void;
  onNewScenario: () => void;
  onSaveSnapshotA: () => void;
  onSaveSnapshotB: () => void;
  onCompare: () => void;
  compareOverlay: CompareOverlayMode;
  overlayEnabled: boolean;
  onToggleOverlay: () => void;
  onViewChange: (view: "editor" | "library") => void;
  onToggleDocs: () => void;
};

export default function Toolbar({
  disableSave,
  disableRun,
  status,
  statusMessage,
  activeView,
  docsOpen,
  onCheckEngine,
  onRun,
  onNewScenario,
  onSaveSnapshotA,
  onSaveSnapshotB,
  onCompare,
  compareOverlay,
  overlayEnabled,
  onToggleOverlay,
  onViewChange,
  onToggleDocs,
}: Props) {
  const overlayActive = compareOverlay === "A-vs-B";
  return (
    <div className="z-toolbar w-full border-b border-border bg-surface px-6 py-3 dark:border-borderDark dark:bg-surfaceDark">
      <div className="flex w-full flex-wrap items-center gap-2">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <Button onClick={onCheckEngine} variant="secondary">
            Check Engine
          </Button>
          <Button
            onClick={onRun}
            variant="primary"
            title="Run Simulation (R)"
            disabled={disableRun}
          >
            Run Simulation
          </Button>
          <Button onClick={onNewScenario} variant="secondary" title="New Scenario (N)">
            New Scenario
          </Button>
          <Button
            onClick={onSaveSnapshotA}
            disabled={disableSave}
            variant="secondary"
            title="Save Snapshot A (1)"
          >
            Save Snapshot A
          </Button>
          <Button
            onClick={onSaveSnapshotB}
            disabled={disableSave}
            variant="secondary"
            title="Save Snapshot B (2)"
          >
            Save Snapshot B
          </Button>
          <Button onClick={onCompare} variant="secondary" title="Compare Snapshots (C)">
            Compare
          </Button>
          <Button
            onClick={onToggleOverlay}
            variant="secondary"
            title="Overlay Compare (O)"
            aria-pressed={overlayActive}
            data-state={overlayActive ? "on" : "off"}
            disabled={!overlayEnabled}
            className="data-[state=on]:border-primary data-[state=on]:text-primary"
            aria-label="Overlay Compare toggle"
          >
            Overlay Compare
          </Button>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <Button
            type="button"
            variant={docsOpen ? "primary" : "secondary"}
            onClick={onToggleDocs}
            aria-pressed={docsOpen}
            aria-label="Toggle docs pane"
            title="Docs pane"
          >
            Docs
          </Button>
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
