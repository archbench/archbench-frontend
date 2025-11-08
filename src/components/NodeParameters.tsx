import { useMemo } from "react";
import { safeParse } from "../utils/json";
import type { Scenario, Node } from "../types/api";
import { inputClass, labelClass } from "./common/formStyles";

type NumericField = "latencyMs" | "varianceFactor" | "capacityRps" | "failureRate" | "costPerHour";

type Props = {
    scenarioJson: string;
    onScenarioChange: (newJson: string) => void;
}

export default function NodeParameters({ scenarioJson, onScenarioChange }: Props) {
    const scenario = useMemo<Scenario | null>(() => safeParse<Scenario>(scenarioJson), [scenarioJson]);

    if (!scenario) {
        return (
            <div className="rounded-md border border-danger/40 bg-danger/5 px-4 py-3 text-sm text-danger">
                Invalid JSON — fix the editor to edit parameters.
            </div>
        );
    }

    const handleChange = (idx: number, field: NumericField, value: string) => {
        const next = structuredClone(scenario);
        const node = next.nodes[idx];
        if (!node) {
            return;
        }

        const trimmed = value.trim();
        if (trimmed === "") {
            const updated: Node = { ...node };
            delete updated[field];
            next.nodes[idx] = updated;
        } else {
            const parsed = Number(trimmed);
            if (Number.isNaN(parsed)) {
                const updated: Node = { ...node };
                delete updated[field];
                next.nodes[idx] = updated;
            } else {
                next.nodes[idx] = { ...node, [field]: parsed } as Node;
            }
        }
        onScenarioChange(JSON.stringify(next, null, 2));
    };

    return (
        <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-text">Node Parameters</h2>
            {scenario.nodes?.length ? (
                <div className="flex flex-col gap-4">
                    {scenario.nodes.map((n, idx) => (
                        <div
                            key={n.id ?? idx}
                            className="flex flex-col gap-3 rounded-md border border-border bg-surface p-4 shadow-subtle dark:border-borderDark dark:bg-surfaceDark"
                        >
                            <div className="flex items-center justify-between text-sm font-semibold text-text">
                                {n.id || `<node-${idx}>`} <span className="font-normal text-muted">({n.type})</span>
                            </div>

                            <Field
                                label="latencyMs"
                                value={n.latencyMs ?? ""}
                                placeholder="e.g. 8"
                                onChange={(v) => handleChange(idx, "latencyMs", v)}
                            />
                            <Field
                                label="varianceFactor"
                                value={n.varianceFactor ?? ""}
                                placeholder="e.g. 1.5"
                                onChange={(v) => handleChange(idx, "varianceFactor", v)}
                            />
                            <Field
                                label="capacityRps"
                                value={n.capacityRps ?? ""}
                                placeholder="e.g. 3000"
                                onChange={(v) => handleChange(idx, "capacityRps", v)}
                            />
                            <Field
                                label="failureRate"
                                value={n.failureRate ?? ""}
                                placeholder="e.g. 0.005"
                                onChange={(v) => handleChange(idx, "failureRate", v)}
                            />
                            <Field
                                label="costPerHour"
                                value={n.costPerHour ?? ""}
                                placeholder="e.g. 0.05"
                                onChange={(v) => handleChange(idx, "costPerHour", v)}
                            />
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-md border border-dashed border-border/60 bg-surface px-4 py-6 text-center text-sm text-muted dark:border-borderDark/60 dark:bg-surfaceDark">
                    No nodes in scenario.
                </div>
            )}
        </div>
    );
}

function Field({
    label,
    value,
    placeholder,
    onChange,
}: {
    label: NumericField;
    value: number | string;
    placeholder?: string;
    onChange: (v: string) => void;
}) {
    return (
        <div className="field-row flex flex-col gap-1">
            <label className={labelClass}>{label}</label>
            <input
                type="text"
                value={String(value)}
                placeholder={placeholder}
                onChange={(e) => onChange(e.target.value)}
                className={inputClass}
            />
        </div>
    );
}
