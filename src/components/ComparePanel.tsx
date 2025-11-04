import type { Snapshot } from '../types/snapshots';
import { delta, formatLocal } from '../utils/snapshots';

interface Props {
  snapA: Snapshot;
  snapB: Snapshot;
}

type MetricKey = 'p50' | 'p95' | 'throughput' | 'cost';

type MetricDefinition = {
  key: MetricKey;
  label: string;
  select: (snapshot: Snapshot) => number | undefined;
  format: 'latency' | 'throughput' | 'cost';
};

const METRICS: MetricDefinition[] = [
  {
    key: 'p50',
    label: 'p50 latency (ms)',
    select: (snapshot) => snapshot.result.latencyMsP50,
    format: 'latency',
  },
  {
    key: 'p95',
    label: 'p95 latency (ms)',
    select: (snapshot) => snapshot.result.latencyMsP95,
    format: 'latency',
  },
  {
    key: 'throughput',
    label: 'throughput (req/s)',
    select: (snapshot) => snapshot.result.throughputRps,
    format: 'throughput',
  },
  {
    key: 'cost',
    label: 'cost ($/h)',
    select: (snapshot) => snapshot.result.costPerHour,
    format: 'cost',
  },
];

type FormatCategory = MetricDefinition['format'];

type DeltaDescriptor = ReturnType<typeof delta>;

function formatMetric(value: number | undefined, category: FormatCategory): string {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return '—';
  }
  if (category === 'cost') {
    return value.toFixed(3);
  }
  return Math.round(value).toString();
}

function renderDelta(
  descriptor: DeltaDescriptor,
  category: FormatCategory,
  hasValues: boolean
): string {
  const arrow = descriptor.sign === 'up' ? '↑' : descriptor.sign === 'down' ? '↓' : '–';
  if (!hasValues) {
    return `${arrow} —`;
  }
  const magnitude = Math.abs(descriptor.abs);
  const magnitudeText = formatMetric(magnitude, category);
  const pctText = descriptor.pct === null ? '—' : `${Math.abs(descriptor.pct).toFixed(1)}%`;
  return pctText === '—'
    ? `${arrow} ${magnitudeText}`
    : `${arrow} ${magnitudeText} (${pctText})`;
}

export default function ComparePanel({ snapA, snapB }: Props) {
  return (
    <div style={{ marginTop: 24, border: '1px solid #ddd', borderRadius: 10, padding: 16 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Snapshot A</div>
          <div style={{ fontSize: 16 }}>{snapA.name || 'Unnamed'}</div>
          <div style={{ fontSize: 12, color: '#666' }}>{formatLocal(snapA.savedAt)}</div>
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, textAlign: 'right' }}>Snapshot B</div>
          <div style={{ fontSize: 16, textAlign: 'right' }}>{snapB.name || 'Unnamed'}</div>
          <div style={{ fontSize: 12, color: '#666', textAlign: 'right' }}>{formatLocal(snapB.savedAt)}</div>
        </div>
      </div>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', borderBottom: '1px solid #ddd', padding: '8px 4px' }}>Metric</th>
            <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: '8px 4px' }}>Snapshot A</th>
            <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: '8px 4px' }}>Snapshot B</th>
            <th style={{ textAlign: 'right', borderBottom: '1px solid #ddd', padding: '8px 4px' }}>Δ</th>
          </tr>
        </thead>
        <tbody>
          {METRICS.map((metric) => {
            const valueA = metric.select(snapA);
            const valueB = metric.select(snapB);
            const descriptor = delta(valueA, valueB);
            const hasValues = typeof valueA === 'number' && typeof valueB === 'number';
            return (
              <tr key={metric.key}>
                <td style={{ padding: '8px 4px', borderBottom: '1px solid #eee' }}>{metric.label}</td>
                <td style={{ padding: '8px 4px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                  {formatMetric(valueA, metric.format)}
                </td>
                <td style={{ padding: '8px 4px', borderBottom: '1px solid #eee', textAlign: 'right' }}>
                  {formatMetric(valueB, metric.format)}
                </td>
                <td style={{ padding: '8px 4px', borderBottom: '1px solid #eee', textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {renderDelta(descriptor, metric.format, hasValues)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
