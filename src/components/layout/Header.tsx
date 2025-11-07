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
  return (
    <div className="app-header">
      <div className="app-header__brand">
        <span className="app-header__logo">ArchBench</span>
        <span className="app-header__scenario">{scenarioName}</span>
      </div>
      <div className="app-header__center">{centerSlot}</div>
      <div className="app-header__actions">
        <button type="button" onClick={onCheckEngine}>
          Check Engine
        </button>
        <button type="button" onClick={onRun}>
          Run Simulation
        </button>
        <button type="button" onClick={onNewScenario}>
          New Scenario
        </button>
        <button type="button" onClick={onSaveSnapshotA} disabled={disableSave}>
          Save Snapshot A
        </button>
        <button type="button" onClick={onSaveSnapshotB} disabled={disableSave}>
          Save Snapshot B
        </button>
        <button type="button" onClick={onCompare}>
          Compare
        </button>
        <StatusPill status={status} label={statusMessage} />
      </div>
    </div>
  );
}
