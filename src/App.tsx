import { useState } from 'react'

import './App.css'

function App() {
  const [status, setStatus] = useState("Idle");

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

  return (
    <div style={{ padding: 20, fontSize: 18 }}>
      <h1>ArchBench</h1>
      <button onClick={checkEngine}>Check Engine</button>
      <p style={{ marginTop: 15 }}>{status}</p>
    </div>
  )
}

export default App
