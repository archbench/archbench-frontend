import { useEffect, useMemo, useState } from "react";
import { Field, NumberInput, UnitSuffix } from "@/components/forms/Form";
import type { Scenario, Workload } from "@/types/api";
import { safeParse } from "@/utils/json";
import {
  validateWorkloadCostTarget,
  validateWorkloadP95,
  validateWorkloadRps,
} from "@/utils/validators";

type Props = {
  scenarioJson: string;
  onScenarioChange: (nextJson: string) => void;
  onValidityChange?: (isValid: boolean) => void;
};

type WorkloadField = keyof Workload;

const FIELD_CONFIG: Record<WorkloadField, { label: string; placeholder: string; description: string; unit: string }> = {
  rps: {
    label: "Requests per second",
    placeholder: "e.g. 1200",
    description: "Target steady-state throughput.",
    unit: "rps",
  },
  p95TargetMs: {
    label: "p95 target",
    placeholder: "e.g. 180",
    description: "Latency budget for 95% of requests.",
    unit: "ms",
  },
  costTargetPerHour: {
    label: "Cost target (optional)",
    placeholder: "e.g. 12",
    description: "Budget ceiling for this workload.",
    unit: "$/h",
  },
};

const validators = {
  rps: validateWorkloadRps,
  p95TargetMs: validateWorkloadP95,
  costTargetPerHour: validateWorkloadCostTarget,
};

export default function WorkloadInspector({ scenarioJson, onScenarioChange, onValidityChange }: Props) {
  const scenario = useMemo<Scenario | null>(() => safeParse<Scenario>(scenarioJson), [scenarioJson]);
  const [touched, setTouched] = useState<Record<WorkloadField, boolean>>({
    rps: false,
    p95TargetMs: false,
    costTargetPerHour: false,
  });

  useEffect(() => {
    if (!scenario) {
      onValidityChange?.(false);
    }
  }, [scenario, onValidityChange]);

  if (!scenario) {
    return (
      <div className="rounded-md border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
        Invalid JSON — fix the editor to edit workload.
      </div>
    );
  }

  const workload = scenario.workload ?? {};

  const validation = useMemo(
    () => ({
      rps: validators.rps(workload.rps),
      p95TargetMs: validators.p95TargetMs(workload.p95TargetMs),
      costTargetPerHour: validators.costTargetPerHour(workload.costTargetPerHour),
    }),
    [workload.costTargetPerHour, workload.p95TargetMs, workload.rps],
  );

  const formIsValid = !validation.rps && !validation.p95TargetMs && !validation.costTargetPerHour;

  useEffect(() => {
    onValidityChange?.(formIsValid);
  }, [formIsValid, onValidityChange]);

  const handleChange = (field: WorkloadField, rawValue: string) => {
    const next = structuredClone(scenario);
    const trimmed = rawValue.trim();
    if (!trimmed) {
      if (next.workload) {
        delete next.workload[field];
      }
    } else {
      const parsed = Number(trimmed);
      if (Number.isNaN(parsed)) {
        if (next.workload) {
          delete next.workload[field];
        }
      } else {
        next.workload = { ...(next.workload ?? {}), [field]: parsed };
      }
    }

    if (next.workload && !Object.keys(next.workload).length) {
      delete next.workload;
    }

    onScenarioChange(JSON.stringify(next, null, 2));
  };

  const fields = Object.keys(FIELD_CONFIG) as WorkloadField[];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">Workload target</p>
        <p className="text-sm text-textMuted">Controls planner heuristics and disables run while invalid.</p>
      </div>
      <section className="space-y-4 rounded-md border border-border bg-surface p-4 shadow-card dark:border-borderDark dark:bg-surfaceDark">
        <div className="grid gap-3 md:grid-cols-2">
          {fields.map((field) => {
            const config = FIELD_CONFIG[field];
            const value = workload[field];
            const error = touched[field] ? validation[field] ?? undefined : undefined;
            const inputId = `workload-${field}`;
            return (
              <Field
                key={field}
                label={config.label}
                htmlFor={inputId}
                description={config.description}
                error={error}
                required={field !== "costTargetPerHour"}
              >
                {({ describedBy }) => (
                  <div className="relative">
                    <NumberInput
                      id={inputId}
                      value={(value ?? "").toString()}
                      placeholder={config.placeholder}
                      aria-describedby={describedBy}
                      invalid={Boolean(error)}
                      onChange={(event) => handleChange(field, event.target.value)}
                      onBlur={() => setTouched((prev) => ({ ...prev, [field]: true }))}
                    />
                    <UnitSuffix>{config.unit}</UnitSuffix>
                  </div>
                )}
              </Field>
            );
          })}
        </div>
      </section>
    </div>
  );
}
