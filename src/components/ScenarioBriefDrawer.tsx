import type { ScenarioPreset } from "../data/scenarios";

type Props = {
  open: boolean;
  loading: boolean;
  error: string | null;
  brief: { preset: ScenarioPreset; content: string } | null;
  onClose: () => void;
};

export default function ScenarioBriefDrawer({ open, loading, error, brief, onClose }: Props) {
  if (!open || !brief) {
    return null;
  }

  const paragraphs = brief.content
    .split(/\n\n+/)
    .map((chunk) => chunk.trim())
    .filter(Boolean);

  return (
    <div className="brief-drawer" role="dialog" aria-modal="true">
      <div className="brief-drawer__header">
        <div>
          <h3>{brief.preset.label}</h3>
          <p>/{brief.preset.id}</p>
        </div>
        <button type="button" onClick={onClose}>
          Close
        </button>
      </div>

      <div className="brief-drawer__body">
        <table>
          <thead>
            <tr>
              <th>Metric</th>
              <th>Target</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Requests/sec</td>
              <td>{brief.preset.workload.rps.toLocaleString()}</td>
            </tr>
            <tr>
              <td>p95 (ms)</td>
              <td>{brief.preset.workload.p95TargetMs}</td>
            </tr>
            <tr>
              <td>Cost ($/h)</td>
              <td>{brief.preset.workload.costTargetUsd.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {loading ? <p>Loading brief…</p> : null}
        {error ? <p className="inspector-warning">{error}</p> : null}

        {!loading && !error ? (
          <div className="brief-drawer__content">
            {paragraphs.length ? (
              paragraphs.map((paragraph, idx) => <p key={idx}>{paragraph}</p>)
            ) : (
              <p>No additional description provided.</p>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
