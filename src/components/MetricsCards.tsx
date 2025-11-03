import type { SimulationResult } from "../types/api";

type Props = {
    result: SimulationResult | null;
};

const EXPLAIN = {
  p50: "Sum of node latencies along the main path (v1: sum of all nodes).",
  p95: "p50 × average(varianceFactor) across nodes (rounded).",
  thr: "Minimum capacityRps across nodes (bottleneck).",
  cost: "Sum of node costPerHour along the path (v1: sum of all nodes).",
};


export default function MetricsCards({ result }: Props) {
    if (!result) return null;

    const Item = ({
    label, value, explain,
  }: { label: string; value: string | number | undefined; explain: string }) => (
    <div style={{
      padding: 14, border: "1px solid #ddd", borderRadius: 10,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
    }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{value ?? "—"}</div>
      <div style={{ fontSize: 12, opacity: 0.7, marginTop: 6 }}>{explain}</div>
    </div>
  );

  return (
    <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px,1fr))", gap: 12 }}>
      <Item label="p50 latency (ms)" value={result.latencyMsP50} explain={EXPLAIN.p50} />
      <Item label="p95 latency (ms)" value={result.latencyMsP95} explain={EXPLAIN.p95} />
      <Item label="throughput (req/s)" value={result.throughputRps} explain={EXPLAIN.thr} />
      <Item label="cost ($/h)" value={result.costPerHour} explain={EXPLAIN.cost} />
      <Item label="status" value={result.status} explain={"Engine response status."} />
    </div>
  );
}
