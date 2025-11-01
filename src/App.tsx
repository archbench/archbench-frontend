import { useState } from 'react'

import './App.css'

const defaultScenario = {
  name: "demo-scenario",
  nodes: [
    { id: "client", type: "client" },
    { id: "api", type: "service" },
    { id: "db", type: "database" }
  ],
  edges: [
    { from: "client", to: "api" },
    { from: "api", to: "db" }
  ]
};

function App() {
  const [status, setStatus] = useState("Idle");
  const [scenarioJson, setScenarioJson] = useState(() => {
    const saved = localStorage.getItem("scenario");
    return saved ?? JSON.stringify(defaultScenario, null, 2);
  });
  const [simulationResult, setSimulationResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const checkEngine = async () => {
    try {
      const res = await fetch("http://localhost:8080/health");
      const text = await res.text();

      if (text.trim().toLowerCase() === "ok") {
        setStatus("✅ Engine connected");
      } else {
        setStatus("⚠️ Unexpected response");
      }
    } catch (err) {
      setStatus("❌ Engine unreachable");
    }
  };

  const runSimulation = async () => {
    try {
      const parsed = JSON.parse(scenarioJson);
      const res = await fetch("http://localhost:8080/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed)
      });
      const data = await res.json();
      setSimulationResult(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Invalid JSON");
      setSimulationResult(null);

    }
  };

  return (
    <div style={{ padding: 20, fontSize: 18 }}>
      <h1>ArchBench</h1>
      <button onClick={checkEngine}>Check Engine</button>
      <p style={{ marginTop: 15 }}>{status}</p>

      <textarea
        style={{ width: "100%", height: "200px", marginTop: "20px" }}
        value={scenarioJson}
        onChange={(e) => {
          setScenarioJson(e.target.value);
          localStorage.setItem("scenario", e.target.value);
        }}
      />

      <button onClick={runSimulation} style={{ marginTop: 20 }}>
        Run Simulation
      </button>

      <div style={{ marginTop: "10px" }}>
        <button
          onClick={() => {
            setScenarioJson(JSON.stringify(defaultScenario, null, 2));
            localStorage.setItem("scenario", JSON.stringify(defaultScenario, null, 2));
          }}
          style={{ marginRight: "10px" }}
        >
          Reset to Default
        </button>

        <button
          onClick={() => {
            setScenarioJson("{\n  \"name\": \"new-scenario\",\n  \"nodes\": [],\n  \"edges\": []\n}");
            localStorage.setItem("scenario", "{ \"name\": \"new-scenario\", \"nodes\": [], \"edges\": [] }");
          }}
        >
          New Scenario
        </button>
      </div>


      {simulationResult && (
        <pre style={{ marginTop: 15, background: "#eee", padding: 10 }}>
          {JSON.stringify(simulationResult, null, 2)}
        </pre>
      )}

      {error && (
        <p style={{ color: "red" }}>JSON error: {error}</p>
      )}

    </div>
  )
}

export default App
