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
import Toolbar from './components/common/Toolbar';
import { safeParse } from './utils/json';
import InspectorTabs from './components/Inspector/Tabs';
import DbInspector from './components/Inspector/DbInspector';
import WorkloadInspector from './components/Inspector/WorkloadInspector';
import JsonEditor from './components/Editor/JsonEditor';
import ScenarioSelector from './components/ScenarioSelector';
import ScenarioBriefDrawer from './components/ScenarioBriefDrawer';
import { SCENARIO_PRESETS, BLANK_SCENARIO } from './data/scenarios';

function App() {
  const [engineStatus, setEngineStatus] = useState("Engine not checked");
  const [scenarioJson, setScenarioJson] = useState(() => {
    const saved = localStorage.getItem("scenario");
    return saved ?? JSON.stringify(BLANK_SCENARIO, null, 2);
  });
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [snapshotA, setSnapshotA] = useState<Snapshot | null>(null);
  const [snapshotB, setSnapshotB] = useState<Snapshot | null>(null);
  const [runStatus, setRunStatus] = useState<RunStatus>("idle");
  const [runMessage, setRunMessage] = useState("Idle");
  const compareRef = useRef<HTMLDivElement | null>(null);
  const briefCache = useRef(new Map<string, string>());
  const [briefState, setBriefState] = useState<{ preset: typeof SCENARIO_PRESETS[number]; content: string } | null>(null);
  const [briefOpen, setBriefOpen] = useState(false);
  const [briefLoading, setBriefLoading] = useState(false);
  const [briefError, setBriefError] = useState<string | null>(null);

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
  const activePreset = useMemo(() => {
    if (!scenario?.name) {
      return null;
    }
    return SCENARIO_PRESETS.find((preset) => preset.id === scenario.name) ?? null;
  }, [scenario]);
  const activePresetId = activePreset?.id ?? null;

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
    persistScenario(JSON.stringify(BLANK_SCENARIO, null, 2));
    setSimulationResult(null);
    setError(null);
    setRunStatus("idle");
    setRunMessage("Ready");
  };

  const handleSelectPreset = (presetId: string) => {
    const preset = SCENARIO_PRESETS.find((item) => item.id === presetId);
    if (!preset) {
      return;
    }
    persistScenario(JSON.stringify(preset.scenario, null, 2));
    setSimulationResult(null);
    setError(null);
    setRunStatus("idle");
    setRunMessage("Ready");
  };

  const handleShowBrief = async (presetId: string) => {
    const preset = SCENARIO_PRESETS.find((item) => item.id === presetId);
    if (!preset) {
      return;
    }
    setBriefOpen(true);
    setBriefError(null);
    const cached = briefCache.current.get(presetId);
    if (cached) {
      setBriefState({ preset, content: cached });
      setBriefLoading(false);
      return;
    }
    setBriefLoading(true);
    try {
      const response = await fetch(`/scenarios/${preset.id}/brief.md`);
      if (!response.ok) {
        throw new Error("Failed to load brief");
      }
      const text = await response.text();
      briefCache.current.set(preset.id, text);
      setBriefState({ preset, content: text });
    } catch (err) {
      console.error(err);
      setBriefState({ preset, content: "" });
      setBriefError("Unable to load brief");
    } finally {
      setBriefLoading(false);
    }
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
        <>
          <Header
            scenarioName={scenarioName}
            centerSlot={
              <ScenarioSelector
                presets={SCENARIO_PRESETS}
                activeId={activePresetId}
                onSelect={handleSelectPreset}
                onShowBrief={handleShowBrief}
              />
            }
          />
          <Toolbar
            disableSave={disableSave}
            status={runStatus}
            statusMessage={runMessage}
            onCheckEngine={checkEngine}
            onRun={runSimulation}
            onNewScenario={handleNewScenario}
            onSaveSnapshotA={() => saveSnapshotForKey(SNAP_A_KEY, setSnapshotA)}
            onSaveSnapshotB={() => saveSnapshotForKey(SNAP_B_KEY, setSnapshotB)}
            onCompare={handleCompareClick}
          />
        </>
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
          <InspectorTabs
            tabs={[
              {
                id: "node",
                label: "Node",
                content: (
                  <NodeParameters
                    scenarioJson={scenarioJson}
                    onScenarioChange={persistScenario}
                  />
                ),
              },
              {
                id: "db",
                label: "Database",
                content: (
                  <DbInspector
                    scenarioJson={scenarioJson}
                    onScenarioChange={persistScenario}
                  />
                ),
              },
              {
                id: "workload",
                label: "Workload",
                content: (
                  <WorkloadInspector
                    scenarioJson={scenarioJson}
                    onScenarioChange={persistScenario}
                  />
                ),
              },
              {
                id: "json",
                label: "JSON",
                content: (
                  <JsonEditor value={scenarioJson} onChange={persistScenario} />
                ),
              },
            ]}
          />
        </section>
      </div>

      <ErrorBanner message={error} />
      <ScenarioBriefDrawer
        open={briefOpen}
        loading={briefLoading}
        error={briefError}
        brief={briefState}
        onClose={() => setBriefOpen(false)}
      />
    </AppShell>
  )
}

export default App
