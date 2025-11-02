type Props = {
    result : {
        latencyMsP50?: number;
        latencyMsP95?: number;
        throughputRps?: number;
        costPerHour?: number;
        status?: string;
        [k: string]: any;
    } | null;
};

export default function MetricsCards({ result }: Props) {
    if (!result) return null;

    const Item = ({ label, value }: { label: string; value: string | number | undefined }) => (
    <div style={{
      padding: 14, border: "1px solid #ddd", borderRadius: 10,
      boxShadow: "0 1px 2px rgba(0,0,0,0.04)"
    }}>
      <div style={{ fontSize: 12, opacity: 0.7 }}>{label}</div>
      <div style={{ fontSize: 20, fontWeight: 700, marginTop: 6 }}>{value ?? "—"}</div>
    </div>
  );

  return (
    <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px,1fr))", gap: 12 }}>
      <Item label="p50 latency (ms)" value={result.latencyMsP50} />
      <Item label="p95 latency (ms)" value={result.latencyMsP95} />
      <Item label="throughput (req/s)" value={result.throughputRps} />
      <Item label="cost ($/h)" value={result.costPerHour} />
      <Item label="status" value={result.status} />
    </div>
  );
}