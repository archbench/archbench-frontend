import { useState } from 'react'
import NodeParameters from './components/NodeParameters';
import MetricsCards from './components/MetricsCards';
import './App.css'

const presets: Record<string, any> = {
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
  const [status, setStatus] = useState("Idle");
  const [scenarioJson, setScenarioJson] = useState(() => {
    const saved = localStorage.getItem("scenario");
    return saved ?? JSON.stringify(presets["Blank Scenario"], null, 2);
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

      <NodeParameters
        scenarioJson={scenarioJson}
        onScenarioChange={(json) => {
          setScenarioJson(json);
          localStorage.setItem("scenario", json);
        }}
      />


      <button onClick={runSimulation} style={{ marginTop: 20 }}>
        Run Simulation
      </button>

      <MetricsCards result={simulationResult} />

      <div style={{ marginTop: "10px" }}>
        <button
          onClick={() => {
            const defaultScenario = presets["URL Shortener"]; // or choose another default
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
