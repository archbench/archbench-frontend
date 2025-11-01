import { useState } from 'react'

import './App.css'

const sampleScenario = {
  name : "demo-scenario",
  nodes : [
    {id: "client", type: "client"},
    {id: "api", type: "service"},
    {id: "db", type: "database"}
  ],
  edges : [
    {from: "client", to: "api"},
    {from: "api", to: "db"}
  ]
};

function App() {
  const [status, setStatus] = useState("Idle");
  const [simulationResult, setSimulationResult] = useState<any>(null);

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
    try{
      const res = await fetch("http://localhost:8080/simulate", {
        method: "POST",
        headers : {"Content-Type": "application/json"},
        body: JSON.stringify(sampleScenario)
      });
      const data = await res.json();
      setSimulationResult(data);
    }catch(err){
      setSimulationResult({ error: "Engine unreachable" });
    }
  };

  return (
    <div style={{ padding: 20, fontSize: 18 }}>
      <h1>ArchBench</h1>
      <button onClick={checkEngine}>Check Engine</button>
      <p style={{ marginTop: 15 }}>{status}</p>

      <button onClick={runSimulation} style={{ marginTop: 20 }}>
        Run Simulation
      </button>

      {simulationResult && (
        <pre style={{ marginTop: 15, background: "#eee", padding: 10 }}>
{JSON.stringify(simulationResult, null, 2)}
        </pre>
      )}
    </div>
  )
}

export default App
