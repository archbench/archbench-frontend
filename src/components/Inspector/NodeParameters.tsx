import { useMemo, useState } from "react";
import type { Node, Scenario } from "@/types/api";
import { safeParse } from "@/utils/json";
import {
  validateCapacityRps,
  validateCostPerHour,
  validateFailureRate,
  validateLatencyMs,
  type NumericValidator,
} from "@/utils/validators";
import { Field, NumberInput, UnitSuffix } from "@/components/forms/Form";

type NumericField = "latencyMs" | "varianceFactor" | "capacityRps" | "failureRate" | "costPerHour";

type Props = {
  scenarioJson: string;
  onScenarioChange: (nextJson: string) => void;
};

type FieldConfig = {
  label: string;
  placeholder: string;
  description: string;
  unit?: string;
  validator?: NumericValidator;
};

const FIELD_CONFIG: Record<NumericField, FieldConfig> = {
  latencyMs: {
    label: "Latency (p50)",
    placeholder: "e.g. 8",
    description: "Median response time target for this node.",
    unit: "ms",
    validator: validateLatencyMs,
  },
  varianceFactor: {
    label: "Variance factor",
    placeholder: "e.g. 1.4",
    description: "Multiplier applied to model p95 latency.",
    unit: "×",
  },
  capacityRps: {
    label: "Capacity",
    placeholder: "e.g. 3200",
    description: "Estimated steady-state throughput before throttling.",
    unit: "rps",
    validator: validateCapacityRps,
  },
  failureRate: {
    label: "Failure rate",
    placeholder: "e.g. 0.005",
    description: "Chance of failure per request (0 to 1).",
    unit: "ratio",
    validator: validateFailureRate,
  },
  costPerHour: {
    label: "Cost per hour",
    placeholder: "e.g. 0.12",
    description: "Infrastructure cost allocation for this node.",
    unit: "$/h",
    validator: validateCostPerHour,
  },
};

type ErrorMap = Record<string, string>;

export default function NodeParameters({ scenarioJson, onScenarioChange }: Props) {
  const scenario = useMemo<Scenario | null>(() => safeParse<Scenario>(scenarioJson), [scenarioJson]);
  const [errors, setErrors] = useState<ErrorMap>({});

  if (!scenario) {
    return (
      <div className="rounded-md border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
        Invalid JSON — fix the editor to edit parameters.
      </div>
    );
  }

  const nodes = scenario.nodes ?? [];

  const handleNumericChange = (nodeIndex: number, field: NumericField, rawValue: string) => {
    const next = structuredClone(scenario);
    const node = next.nodes[nodeIndex];
    if (!node) {
      return;
    }

    const trimmed = rawValue.trim();
    if (!trimmed) {
      const updated: Node = { ...node };
      delete updated[field];
      next.nodes[nodeIndex] = updated;
    } else {
      const numericValue = Number(trimmed);
      if (Number.isNaN(numericValue)) {
        const updated: Node = { ...node };
        delete updated[field];
        next.nodes[nodeIndex] = updated;
      } else {
        next.nodes[nodeIndex] = { ...node, [field]: numericValue };
      }
    }

    onScenarioChange(JSON.stringify(next, null, 2));
  };

  const handleBlur = (nodeIndex: number, field: NumericField, rawValue: string) => {
    const trimmed = rawValue.trim();
    const errorKey = getErrorKey(nodeIndex, field);

    if (trimmed && Number.isNaN(Number(trimmed))) {
      setErrors((prev) => ({ ...prev, [errorKey]: "Enter a valid number." }));
      return;
    }

    const validator = FIELD_CONFIG[field].validator;
    const numericValue = trimmed ? Number(trimmed) : undefined;
    const message = validator ? validator(numericValue) : null;

    setErrors((prev) => {
      if (!message) {
        const { [errorKey]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [errorKey]: message };
    });
  };

  if (!nodes.length) {
    return (
      <div className="rounded-md border border-dashed border-border/60 bg-surface px-4 py-6 text-center text-sm text-textMuted dark:border-borderDark/60 dark:bg-surfaceDark">
        No nodes defined in this scenario.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-textMuted">Performance</p>
        <p className="text-sm text-textMuted">Tune per-node latency, capacity, and cost assumptions.</p>
      </div>
      <div className="space-y-4">
        {nodes.map((node, nodeIndex) => (
          <section
            key={node.id ?? nodeIndex}
            className="space-y-4 rounded-md border border-border bg-surface p-4 shadow-card dark:border-borderDark dark:bg-surfaceDark"
          >
            <header className="flex flex-col gap-0.5 text-sm">
              <span className="font-semibold text-foreground">{node.id || `node-${nodeIndex}`}</span>
              <span className="text-textMuted">{node.type}</span>
            </header>

            <div className="grid gap-3 md:grid-cols-2">
              {(Object.keys(FIELD_CONFIG) as NumericField[]).map((field) => {
                const config = FIELD_CONFIG[field];
                const value = node[field];
                const inputId = `${node.id ?? nodeIndex}-${field}`;
                const errorKey = getErrorKey(nodeIndex, field);
                const error = errors[errorKey];
                return (
                  <Field
                    key={field}
                    htmlFor={inputId}
                    label={config.label}
                    description={config.description}
                    error={error}
                  >
                    {({ describedBy }) => (
                      <div className="relative">
                        <NumberInput
                          id={inputId}
                          value={(value ?? "").toString()}
                          placeholder={config.placeholder}
                          onChange={(event) => handleNumericChange(nodeIndex, field, event.target.value)}
                          onBlur={(event) => handleBlur(nodeIndex, field, event.target.value)}
                          aria-describedby={describedBy}
                          invalid={Boolean(error)}
                        />
                        {config.unit ? <UnitSuffix>{config.unit}</UnitSuffix> : null}
                      </div>
                    )}
                  </Field>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function getErrorKey(nodeIndex: number, field: NumericField) {
  return `${nodeIndex}-${field}`;
}
