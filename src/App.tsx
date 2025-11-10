import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import NodeParameters from './components/NodeParameters';
import MetricsCards from './components/MetricsCards';
import ScoreCard from './components/Metrics/ScoreCard';
import HintsList from './components/Metrics/HintsList';
import RubricPanel from './components/Grading/RubricPanel';
import WhatIfList from './components/Grading/WhatIfList';
import DocsPane from './components/Docs/DocsPane';
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
import Button from './components/common/Button';
import { safeParse } from './utils/json';
import InspectorTabs from './components/Inspector/Tabs';
import DbInspector from './components/Inspector/DbInspector';
import WorkloadInspector from './components/Inspector/WorkloadInspector';
import JsonEditor from './components/Editor/JsonEditor';
import ScenarioSelector from './components/ScenarioSelector';
import { PRESETS } from './presets';
import { BLANK_SCENARIO } from './presets/blank';
import { bumpAttempt, loadProgress, replaceProgressState, setSolved } from './utils/storage';
import type { LibraryState } from './types/progress';
import LibraryView from './views/Library';
import { useHotkeys } from './hooks/useHotkeys';

const SOLVED_SCORE_THRESHOLD = 80;
const VIEW_STORAGE_KEY = "archbench:view:last";

type AppView = "editor" | "library";

const getInitialView = (): AppView => {
  if (typeof window === "undefined") {
    return "editor";
  }
  const stored = window.sessionStorage.getItem(VIEW_STORAGE_KEY);
  return stored === "library" ? "library" : "editor";
};

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
  const [libraryState, setLibraryState] = useState<LibraryState>(() => loadProgress());
  const [activeView, setActiveView] = useState<AppView>(() => getInitialView());
  const [docsOpen, setDocsOpen] = useState(false);

  useEffect(() => {
    setSnapshotA(loadSnapshot(SNAP_A_KEY));
    setSnapshotB(loadSnapshot(SNAP_B_KEY));
  }, []);

  const persistScenario = useCallback((json: string) => {
    setScenarioJson(json);
    localStorage.setItem("scenario", json);
  }, []);
  const persistScenarioFromObject = useCallback(
    (nextScenario: Scenario) => {
      persistScenario(JSON.stringify(nextScenario, null, 2));
    },
    [persistScenario],
  );

  const scenario = useMemo(() => safeParse<Scenario>(scenarioJson), [scenarioJson]);
  const scenarioName = scenario?.name ?? "Unnamed scenario";
  const activePreset = useMemo(() => {
    if (!scenario?.name) {
      return null;
    }
    return PRESETS.find((preset) => preset.meta.slug === scenario.name) ?? null;
  }, [scenario]);
  const activePresetSlug = activePreset?.meta.slug ?? null;

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(VIEW_STORAGE_KEY, activeView);
    }
  }, [activeView]);

  const checkEngine = useCallback(async () => {
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
  }, []);

  const runSimulation = useCallback(async () => {
    setRunStatus("running");
    setRunMessage("Running simulation…");
    try {
      const parsed = JSON.parse(scenarioJson) as Scenario;
      const result = await simulate(parsed);
      setSimulationResult(result);
      setError(null);
      setRunStatus("idle");
      setRunMessage("Simulation complete");
      if (activePresetSlug) {
        let updatedState = bumpAttempt(activePresetSlug, result.score);
        if (typeof result.score === "number" && result.score >= SOLVED_SCORE_THRESHOLD) {
          updatedState = setSolved(activePresetSlug, true);
        }
        setLibraryState(updatedState);
      }
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
  }, [scenarioJson, activePresetSlug]);

  const handleNewScenario = useCallback(() => {
    persistScenario(JSON.stringify(BLANK_SCENARIO, null, 2));
    setSimulationResult(null);
    setError(null);
    setRunStatus("idle");
    setRunMessage("Ready");
  }, [persistScenario]);

  const handleSelectPreset = useCallback(
    (presetSlug: string) => {
      const preset = PRESETS.find((item) => item.meta.slug === presetSlug);
      if (!preset) {
        return;
      }
      persistScenario(JSON.stringify(preset.scenario, null, 2));
      setSimulationResult(null);
      setError(null);
      setRunStatus("idle");
      setRunMessage("Ready");
    },
    [persistScenario],
  );

  const saveSnapshotForKey = useCallback(
    (key: string, setter: Dispatch<SetStateAction<Snapshot | null>>) => {
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
    },
    [scenarioJson, simulationResult],
  );

  const handleSaveSnapshotA = useCallback(() => {
    saveSnapshotForKey(SNAP_A_KEY, setSnapshotA);
  }, [saveSnapshotForKey]);

  const handleSaveSnapshotB = useCallback(() => {
    saveSnapshotForKey(SNAP_B_KEY, setSnapshotB);
  }, [saveSnapshotForKey]);

  const restoreSnapshot = (snap: Snapshot | null) => {
    if (!snap) {
      return;
    }
    const nextJson = JSON.stringify(snap.scenario, null, 2);
    persistScenario(nextJson);
    setSimulationResult(null);
    setError(null);
  };

  const handleCompareClick = useCallback(() => {
    compareRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const disableSave = !simulationResult;

  const handleLibraryLoad = useCallback(
    (slug: string) => {
      handleSelectPreset(slug);
      setActiveView("editor");
    },
    [handleSelectPreset],
  );

  const handleToggleSolved = (slug: string, solved: boolean) => {
    const updated = setSolved(slug, solved);
    setLibraryState(updated);
  };

  const handleImportProgress = (state: LibraryState) => {
    const updated = replaceProgressState(state);
    setLibraryState(updated);
  };

  const hotkeyBindings = useMemo(
    () => [
      {
        key: "r",
        handler: () => {
          void runSimulation();
        },
        enabled: activeView === "editor",
      },
      {
        key: "n",
        handler: () => {
          handleNewScenario();
        },
        enabled: activeView === "editor",
      },
      {
        key: "1",
        handler: () => {
          handleSaveSnapshotA();
        },
        enabled: activeView === "editor" && Boolean(simulationResult),
      },
      {
        key: "2",
        handler: () => {
          handleSaveSnapshotB();
        },
        enabled: activeView === "editor" && Boolean(simulationResult),
      },
      {
        key: "c",
        handler: () => {
          handleCompareClick();
        },
        enabled: activeView === "editor",
      },
    ],
    [
      runSimulation,
      handleNewScenario,
      handleSaveSnapshotA,
      handleSaveSnapshotB,
      handleCompareClick,
      activeView,
      simulationResult,
    ],
  );

  useHotkeys(hotkeyBindings);

  const editorFooter = (
    <div>
      <MetricsCards result={simulationResult} />
      {simulationResult ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <ScoreCard score={simulationResult.score} />
          <HintsList hints={simulationResult.hints} />
        </div>
      ) : null}
      {simulationResult && scenario ? (
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <RubricPanel scenario={scenario} result={simulationResult} />
          <WhatIfList
            scenario={scenario}
            result={simulationResult}
            onScenarioChange={persistScenarioFromObject}
          />
        </div>
      ) : null}
      <div className="snapshot-actions flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => restoreSnapshot(snapshotA)}
          disabled={!snapshotA}
        >
          Restore Snapshot A
        </Button>
        <Button
          type="button"
          size="sm"
          variant="secondary"
          onClick={() => restoreSnapshot(snapshotB)}
          disabled={!snapshotB}
        >
          Restore Snapshot B
        </Button>
      </div>
      {snapshotA && snapshotB ? (
        <div ref={compareRef}>
          <ComparePanel snapA={snapshotA} snapB={snapshotB} />
        </div>
      ) : null}
    </div>
  );

  const editorBody = (
    <>
      <div className="engine-status">{engineStatus}</div>
      <div className="app-main-grid">
        <section className="board-column">
          <Board
            scenarioJson={scenarioJson}
            onScenarioChange={persistScenario}
          />
        </section>

        <section className="inspector-column flex w-full justify-end">
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
    </>
  );

  return (
    <>
      <AppShell
        header={
          <>
            <Header
              scenarioName={scenarioName}
              centerSlot={
                <ScenarioSelector
                  presets={PRESETS}
                  activeSlug={activePresetSlug}
                  onSelect={handleSelectPreset}
                />
              }
            />
            <Toolbar
              disableSave={disableSave}
              status={runStatus}
              statusMessage={runMessage}
              activeView={activeView}
              docsOpen={docsOpen}
              onCheckEngine={checkEngine}
              onRun={runSimulation}
              onNewScenario={handleNewScenario}
              onSaveSnapshotA={handleSaveSnapshotA}
              onSaveSnapshotB={handleSaveSnapshotB}
              onCompare={handleCompareClick}
              onViewChange={setActiveView}
              onToggleDocs={() => setDocsOpen((prev) => !prev)}
            />
          </>
        }
        footer={activeView === "editor" ? editorFooter : null}
      >
        {activeView === "library" ? (
          <LibraryView
            presets={PRESETS}
            progress={libraryState}
            onLoadPreset={handleLibraryLoad}
            onToggleSolved={handleToggleSolved}
            onImportProgress={handleImportProgress}
          />
        ) : (
          editorBody
        )}
      </AppShell>
      <DocsPane
        open={docsOpen}
        onOpenChange={setDocsOpen}
        preset={activePreset}
        onLoadPreset={handleSelectPreset}
      />
    </>
  )
}

export default App
