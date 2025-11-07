import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import NodeParameters from './components/NodeParameters';
import MetricsCards from './components/MetricsCards';
import ErrorBanner from './components/ErrorBanner';
import './App.css'
import { getHealth, simulate } from './api/client';
import type { Scenario, SimulationResult } from './types/api';
import type { Snapshot } from './types/snapshots';
import ComparePanel from './components/ComparePanel';
import { SNAP_A_KEY, SNAP_B_KEY, loadSnapshot, saveSnapshot } from './utils/snapshots';
import Board from './components/Board';
import AppShell from './components/layout/AppShell';
import Header from './components/layout/Header';
import type { RunStatus } from './components/common/StatusPill';
import { safeParse } from './utils/json';

const presets: Record<string, Scenario> = {
  "URL Shortener": {
    name: "url-shortener",
    nodes: [
      { id: "client", type: "client" },
      { id: "api", type: "service" },
      { id: "cache", type: "cache" },
      { id: "db", type: "database" }
    ],
    edges: [
      { from: "client", to: "api" },
      { from: "api", to: "cache" },
      { from: "api", to: "db" }
    ]
  },
  "Chat DM": {
    name: "chat-dm",
    nodes: [
      { id: "client", type: "client" },
      { id: "gateway", type: "service" },
      { id: "queue", type: "queue" },
      { id: "worker", type: "service" },
      { id: "store", type: "database" }
    ],
    edges: [
      { from: "client", to: "gateway" },
      { from: "gateway", to: "queue" },
      { from: "queue", to: "worker" },
      { from: "worker", to: "store" }
    ]
  },
  "Checkout": {
    name: "checkout",
    nodes: [
      { id: "client", type: "client" },
      { id: "api", type: "service" },
      { id: "payments", type: "service" },
      { id: "orders-db", type: "database" },
      { id: "cache", type: "cache" }
    ],
    edges: [
      { from: "client", to: "api" },
      { from: "api", to: "payments" },
      { from: "api", to: "orders-db" },
      { from: "api", to: "cache" }
    ]
  },
  "Blank Scenario": {
    name: "new-scenario",
    nodes: [],
    edges: []
  }
};

function App() {
  const [engineStatus, setEngineStatus] = useState("Engine not checked");
  const [scenarioJson, setScenarioJson] = useState(() => {
    const saved = localStorage.getItem("scenario");
    return saved ?? JSON.stringify(presets["Blank Scenario"], null, 2);
  });
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snapshotA, setSnapshotA] = useState<Snapshot | null>(null);
  const [snapshotB, setSnapshotB] = useState<Snapshot | null>(null);
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [runMessage, setRunMessage] = useState("Idle");
  const compareRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSnapshotA(loadSnapshot(SNAP_A_KEY));
    setSnapshotB(loadSnapshot(SNAP_B_KEY));
  }, []);

  const persistScenario = useCallback((json: string) => {
    setScenarioJson(json);
    localStorage.setItem("scenario", json);
  }, []);

  const scenario = useMemo(() => safeParse<Scenario>(scenarioJson), [scenarioJson]);
  const scenarioName = scenario?.name ?? "Unnamed scenario";

  const checkEngine = async () => {
    try {
      const text = await getHealth();
      if (text.toLowerCase() === "ok") {
        setEngineStatus("Engine connected");
      } else {
        setEngineStatus("Unexpected response");
      }
    } catch {
      setEngineStatus("Engine unreachable");
    }
  };

  const runSimulation = async () => {
    setRunStatus("running");
    setRunMessage("Running simulation…");
    try {
      const parsed = JSON.parse(scenarioJson) as Scenario;
      const result = await simulate(parsed);
      setSimulationResult(result);
      setError(null);
      setRunStatus("idle");
      setRunMessage("Simulation complete");
    } catch (err) {
      setRunStatus("error");
      if (err instanceof SyntaxError) {
        setError("Invalid JSON");
        setRunMessage("Invalid JSON");
      } else if (err instanceof Error) {
        setError(err.message);
        setRunMessage(err.message);
      } else {
        setError("Unexpected error");
        setRunMessage("Unexpected error");
      }
      setSimulationResult(null);
    }
  };

  const handleNewScenario = () => {
    persistScenario(JSON.stringify(presets["Blank Scenario"], null, 2));
    setSimulationResult(null);
    setError(null);
    setRunStatus("idle");
    setRunMessage("Ready");
  };

  const saveSnapshotForKey = (
    key: string,
    setter: Dispatch<SetStateAction<Snapshot | null>>
  ) => {
    if (!simulationResult) {
      return;
    }
    try {
      const parsed = JSON.parse(scenarioJson) as Scenario;
      const snap: Snapshot = {
        name: parsed.name || "Unnamed",
        scenario: parsed,
        result: simulationResult,
        savedAt: new Date().toISOString(),
      };
      saveSnapshot(key, snap);
      setter(snap);
    } catch (err) {
      if (err instanceof SyntaxError) {
        window.alert("Scenario JSON is invalid. Fix the editor before saving a snapshot.");
      } else {
        console.error("Failed to save snapshot", err);
      }
    }
  };

  const restoreSnapshot = (snap: Snapshot | null) => {
    if (!snap) {
      return;
    }
    const nextJson = JSON.stringify(snap.scenario, null, 2);
    persistScenario(nextJson);
    setSimulationResult(null);
    setError(null);
  };

  const handleCompareClick = () => {
    compareRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const disableSave = !simulationResult;

  return (
    <AppShell
      header={
        <Header
          scenarioName={scenarioName}
          status={runStatus}
          statusMessage={runMessage}
          disableSave={disableSave}
          onCheckEngine={checkEngine}
          onRun={runSimulation}
          onNewScenario={handleNewScenario}
          onSaveSnapshotA={() => saveSnapshotForKey(SNAP_A_KEY, setSnapshotA)}
          onSaveSnapshotB={() => saveSnapshotForKey(SNAP_B_KEY, setSnapshotB)}
          onCompare={handleCompareClick}
        />
      }
      footer={
        <div>
          <MetricsCards result={simulationResult} />
          <div className="snapshot-actions">
            <button type="button" onClick={() => restoreSnapshot(snapshotA)} disabled={!snapshotA}>
              Restore Snapshot A
            </button>
            <button type="button" onClick={() => restoreSnapshot(snapshotB)} disabled={!snapshotB}>
              Restore Snapshot B
            </button>
          </div>
          {snapshotA && snapshotB ? (
            <div ref={compareRef}>
              <ComparePanel snapA={snapshotA} snapB={snapshotB} />
            </div>
          ) : null}
        </div>
      }
    >
      <div className="engine-status">{engineStatus}</div>
      <div className="app-main-grid">
        <section className="board-column">
          <Board
            scenarioJson={scenarioJson}
            onScenarioChange={persistScenario}
          />
        </section>

        <section className="inspector-column">
          <NodeParameters
            scenarioJson={scenarioJson}
            onScenarioChange={persistScenario}
          />

          <div className="json-editor">
            <label htmlFor="scenario-json">Scenario JSON</label>
            <textarea
              id="scenario-json"
              value={scenarioJson}
              onChange={(e) => {
                persistScenario(e.target.value);
              }}
            />
          </div>
        </section>
      </div>

      <ErrorBanner message={error} />
    </AppShell>
  )
}

export default App
