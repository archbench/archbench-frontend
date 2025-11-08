import { useMemo } from "react";
import { safeParse } from "../../utils/json";
import type { Scenario } from "../../types/api";

type Props = {
  scenarioJson: string;
  onScenarioChange: (nextJson: string) => void;
};

export default function WorkloadInspector({ scenarioJson, onScenarioChange }: Props) {
  const scenario = useMemo<Scenario | null>(() => safeParse<Scenario>(scenarioJson), [scenarioJson]);

  if (!scenario) {
    return (
      <div className="rounded-md border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
        Invalid JSON — fix the editor to edit workload.
      </div>
    );
  }

  const workload = scenario.workload ?? {};

  const handleChange = (field: "rps" | "p95TargetMs", value: string) => {
    const next = structuredClone(scenario);
    const trimmed = value.trim();
    if (!trimmed) {
      if (next.workload) {
        delete next.workload[field];
      }
    } else {
      const asNumber = Number(trimmed);
      if (Number.isNaN(asNumber)) {
        if (next.workload) {
          delete next.workload[field];
        }
      } else {
        if (!next.workload) {
          next.workload = {};
        }
        next.workload[field] = asNumber;
      }
    }
    if (next.workload && !next.workload.rps && !next.workload.p95TargetMs) {
      delete next.workload;
    }
    onScenarioChange(JSON.stringify(next, null, 2));
  };

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-lg font-semibold text-text">Workload</h2>
      <div className="flex flex-col gap-4 rounded-md border border-border bg-surface p-4 shadow-subtle dark:border-borderDark dark:bg-surfaceDark">
        <div className="field-row flex flex-col gap-1">
          <label className="text-sm font-medium text-muted">Requests per second</label>
          <input
            type="number"
            className="text-input"
            placeholder="e.g. 2500 rps"
            value={workload.rps ?? ""}
            onChange={(event) => handleChange("rps", event.target.value)}
          />
        </div>
        <div className="field-row flex flex-col gap-1">
          <label className="text-sm font-medium text-muted">p95 target (ms)</label>
          <input
            type="number"
            className="text-input"
            placeholder="e.g. 150 ms"
            value={workload.p95TargetMs ?? ""}
            onChange={(event) => handleChange("p95TargetMs", event.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
